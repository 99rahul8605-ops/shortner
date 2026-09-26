import { NextResponse } from 'next/server';
import { readProgress, loadVisit, signProgress, progressCookieName,
  cookieOptions, correctOrigin, tokenHash } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!correctOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const progress = await readProgress();
  if (!progress || progress.slug !== body.slug || progress.step !== body.step ||
      progress.routeToken !== body.vt || progress.step < 1 || progress.step > 3) {
    return NextResponse.json({ error: 'Session expired. Open the short link again.' }, { status: 403 });
  }
  const visit = await loadVisit(progress);
  if (!visit) return NextResponse.json({ error: 'Session expired. Open the short link again.' }, { status: 403 });
  if (visit.stage !== 'popup') {
    if (visit.stage === 'timing' || visit.stage === 'revealed') {
      return NextResponse.json({ startedAt: visit.startedAt }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Invalid session stage' }, { status: 403 });
  }
  const now = Date.now();
  if (now - visit.popupAt < 15000) {
    return NextResponse.json({ error: 'Please wait before closing the popup' }, { status: 429 });
  }
  // Conditional UPDATE ensures two tabs cannot independently start this timer.
  const result = await query<{ started_at: string }>(
    `UPDATE visitor_sessions SET stage='timing', started_at=$1
     WHERE id=$2 AND slug=$3 AND step=$4 AND route_token_hash=$5
       AND stage='popup' AND started_at=0 AND popup_at <= $6
       AND expires_at > NOW() RETURNING started_at`,
    [now, progress.sessionId, progress.slug, progress.step, tokenHash(progress.routeToken), now - 15000]
  );
  if (!result.rows[0]) {
    const current = await loadVisit(progress);
    if (!current || !['timing', 'revealed'].includes(current.stage)) {
      return NextResponse.json({ error: 'Session has changed. Refresh this page.' }, { status: 409 });
    }
    return NextResponse.json({ startedAt: current.startedAt }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const startedAt = Number(result.rows[0].started_at);
  const response = NextResponse.json({ startedAt }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(progressCookieName,
    await signProgress({ ...progress, startedAt }), cookieOptions(1200));
  return response;
}
