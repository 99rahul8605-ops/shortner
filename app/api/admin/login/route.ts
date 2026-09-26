import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { adminCookieName, cookieOptions, correctOrigin, signAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

// Admin credentials are supplied as private Render environment variables.
// Never place ADMIN_PASSWORD in NEXT_PUBLIC_ variables or source files.
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
  const name = typeof body.username === 'string' ? body.username : '';
  const pw = typeof body.password === 'string' ? body.password : '';
  const expected = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';
  if (!expected || expected.length < 8 || expected.length > 128 ||
      pw.length > 128 || !safeEqual(name, username) || !safeEqual(pw, expected)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, await signAdmin(), cookieOptions(7 * 24 * 3600));
  return res;
}
