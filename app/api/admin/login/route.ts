import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { adminCookieName, cookieOptions, correctOrigin, signAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!correctOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.username === 'string' ? body.username : '';
  const pw = typeof body.password === 'string' ? body.password : '';

  const expectedName = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || pw.length > 512) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Compare fixed-length digests to avoid ordinary variable-time string comparison.
  const submitted = createHash('sha256').update(pw, 'utf8').digest();
  const expected = createHash('sha256').update(expectedPassword, 'utf8').digest();
  if (name !== expectedName || !timingSafeEqual(submitted, expected)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName, await signAdmin(), cookieOptions(7 * 24 * 3600));
  return res;
}
