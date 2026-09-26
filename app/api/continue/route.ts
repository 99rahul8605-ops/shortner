import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { readProgress, signProgress, progressCookieName, cookieOptions,
  correctOrigin, tokenHash, visitFromRow } from '@/lib/auth';
import { db } from '@/lib/db';
import { getLink, getSettings, seconds } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!correctOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const progress = await readProgress();
  if (!progress || progress.slug !== body.slug || progress.step !== body.step ||
      progress.routeToken !== body.vt || !['reveal', 'advance', 'finish'].includes(body.action)) {
    return NextResponse.json({ error: 'Session expired. Reopen your short link.' }, { status: 403 });
  }
  if ((progress.step === 4 && body.action !== 'finish') ||
      (progress.step !== 4 && body.action === 'finish')) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 403 });
  }
  const [link, settings] = await Promise.all([getLink(progress.slug), getSettings()]);
  if (!link || !link.enabled) return NextResponse.json({ error: 'Link unavailable' }, { status: 404 });

  const client = await db().connect();
  let committed = false;
  try {
    await client.query('BEGIN');
    // Row lock + stage check make every step advancement a one-time transition,
    // even when the user double-clicks or two tabs submit simultaneously.
    const result = await client.query<{
      id: string; slug: string; step: number; stage: 'popup'|'timing'|'revealed'|'final'|'complete';
      started_at: string | number; popup_at: string | number; continue_token_hash: string | null;
    }>(
      `SELECT id, slug, step, stage, started_at, popup_at, continue_token_hash
       FROM visitor_sessions WHERE id=$1 AND slug=$2 AND step=$3
         AND route_token_hash=$4 AND expires_at > NOW() FOR UPDATE`,
      [progress.sessionId, progress.slug, progress.step, tokenHash(progress.routeToken)]
    );
    const row = result.rows[0];
    if (!row || row.stage === 'complete') {
      return NextResponse.json({ error: 'This step was already used. Reopen your short link.' }, { status: 403 });
    }
    const visit = visitFromRow(row);
    if (progress.step === 4 ? visit.stage !== 'final' : !['timing', 'revealed'].includes(visit.stage)) {
      return NextResponse.json({ error: 'Finish the previous step first.' }, { status: 403 });
    }
    if (visit.startedAt <= 0 || Date.now() - visit.startedAt < seconds(settings, progress.step) * 1000) {
      return NextResponse.json({ error: 'Countdown is not finished.' }, { status: 429 });
    }

    if (body.action === 'reveal' && progress.step >= 1 && progress.step <= 3) {
      // First Continue press is recorded server-side. A refresh may request a
      // replacement token, invalidating any older bottom-button token.
      const continueToken = randomBytes(32).toString('base64url');
      await client.query(
        `UPDATE visitor_sessions SET stage='revealed', continue_token_hash=$2 WHERE id=$1`,
        [progress.sessionId, tokenHash(continueToken)]
      );
      await client.query('COMMIT'); committed = true;
      return NextResponse.json({ continueToken }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (body.action === 'advance' && progress.step >= 1 && progress.step <= 3) {
      if (visit.stage !== 'revealed' || typeof body.continueToken !== 'string' ||
          body.continueToken.length > 128 || row.continue_token_hash !== tokenHash(body.continueToken)) {
        return NextResponse.json({ error: 'Use the first Continue button, then Continue below.' }, { status: 403 });
      }
      const nextStep = progress.step + 1;
      const nextRouteToken = randomBytes(24).toString('base64url');
      const now = Date.now();
      await client.query(
        `UPDATE visitor_sessions
         SET step=$2, stage=$3, route_token_hash=$4, continue_token_hash=NULL,
             started_at=$5, popup_at=$6 WHERE id=$1`,
        [progress.sessionId, nextStep, nextStep === 4 ? 'final' : 'popup',
          tokenHash(nextRouteToken), nextStep === 4 ? now : 0, now]
      );
      await client.query('COMMIT'); committed = true;
      const nextProgress = await signProgress({ ...progress, step: nextStep, routeToken: nextRouteToken,
        nonce: randomBytes(32).toString('hex'), startedAt: nextStep === 4 ? now : 0, popupAt: now });
      const next = nextStep === 4
        ? `/get/${encodeURIComponent(progress.slug)}?vt=${encodeURIComponent(nextRouteToken)}`
        : `/go/${encodeURIComponent(progress.slug)}/${nextStep}?vt=${encodeURIComponent(nextRouteToken)}`;
      const response = NextResponse.json({ next });
      response.cookies.set(progressCookieName, nextProgress, cookieOptions(1200));
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    if (body.action === 'finish' && progress.step === 4 && visit.stage === 'final') {
      await client.query(
        `UPDATE visitor_sessions SET stage='complete', expires_at=NOW(), continue_token_hash=NULL
         WHERE id=$1`, [progress.sessionId]
      );
      await client.query('COMMIT'); committed = true;
      const response = NextResponse.json({ next: link.destination });
      response.cookies.delete(progressCookieName);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    return NextResponse.json({ error: 'Invalid step action' }, { status: 403 });
  } finally {
    if (!committed) await client.query('ROLLBACK').catch(() => {});
    client.release();
  }
}
