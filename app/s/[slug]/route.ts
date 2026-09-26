import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { getLink } from '@/lib/data';
import { query } from '@/lib/db';
import { signProgress, progressCookieName, cookieOptions, tokenHash } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9_-]{3,40}$/.test(slug)) return new NextResponse('Link not found', { status: 404 });
  const link = await getLink(slug);
  if (!link || !link.enabled) return new NextResponse('Link unavailable', { status: 404 });

  const routeToken = randomBytes(24).toString('base64url');
  const sessionId = randomUUID();
  const now = Date.now();
  // Each visit has its own persistent row. Starting /s/ creates fresh progress,
  // even when a previous tab in the same browser has a later-step URL.
  await query(
    `INSERT INTO visitor_sessions
       (id, slug, step, stage, route_token_hash, popup_at, started_at, expires_at)
     VALUES ($1, $2, 1, 'popup', $3, $4, 0, NOW() + INTERVAL '20 minutes')`,
    [sessionId, slug, tokenHash(routeToken), now]
  );
  // Opportunistic cleanup; expired sessions are also rejected by every query.
  if (Math.random() < 0.02) {
    await query('DELETE FROM visitor_sessions WHERE expires_at < NOW()').catch(() => {});
  }

  // Existing traffic counters are unaffected; don't store raw visitor IPs.
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || '';
  const ipHash = ip ? createHmac('sha256', process.env.APP_SECRET || '').update(ip).digest('hex') : null;
  const ua = req.headers.get('user-agent') || '';
  const uaHash = ua ? createHash('sha256').update(ua).digest('hex') : null;
  const country = (req.headers.get('cf-ipcountry') || '').slice(0, 3);
  await query(
    'INSERT INTO visits(link_id,ip_hash,ua_hash,country) SELECT id,$1,$2,$3 FROM links WHERE slug=$4',
    [ipHash, uaHash, country || null, slug]
  );

  const progress = await signProgress({ slug, step: 1, startedAt: 0, popupAt: now,
    nonce: randomBytes(32).toString('hex'), routeToken, sessionId });
  const next = new URL(`/go/${encodeURIComponent(slug)}/1`, req.url);
  next.searchParams.set('vt', routeToken);
  const response = NextResponse.redirect(next, 302);
  response.cookies.set(progressCookieName, progress, cookieOptions(1200));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
