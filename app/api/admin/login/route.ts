import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { adminCookieName, cookieOptions, correctOrigin, signAdmin } from '@/lib/auth';
import { throttle } from '@/lib/users';

export const runtime = 'nodejs';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  if (!correctOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const name = typeof body.username === 'string' ? body.username.slice(0, 128) : '';
  const pw = typeof body.password === 'string' ? body.password : '';
  const username = process.env.ADMIN_USERNAME || 'admin';

  // PostgreSQL-backed limits work across all Vercel/Render instances and
  // restarts. A username bucket also caps attempts from rotating IPs.
  // Forwarded IP headers must be set/overwritten by your hosting proxy.
  const ip = (req.headers.get('x-vercel-forwarded-for') ||
    req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') ||
    'unknown').split(',')[0].trim().slice(0, 128);
  const allowedByIp = await throttle(`admin:ip:${ip}`, 12, 900);
  const allowedByName = await throttle(`admin:name:${name.trim().toLowerCase()}`, 30, 900);
  if (!allowedByIp || !allowedByName) {
    return NextResponse.json({ error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900', 'Cache-Control': 'no-store' } });
  }

  // Keep the existing private ADMIN_PASSWORD variable. Never expose it to JS.
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8 || expected.length > 128 ||
      pw.length > 128 || !safeEqual(name, username) || !safeEqual(pw, expected)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookieName, await signAdmin(), cookieOptions(7 * 24 * 3600));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
