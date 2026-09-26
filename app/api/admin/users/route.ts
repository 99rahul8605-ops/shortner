import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { correctOrigin, isAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { emailOk } from '@/lib/users';

export const runtime = 'nodejs';

// Only the site owner can provision accounts. Password is never stored in clear text.
export async function POST(req: Request) {
  if (!correctOrigin(req) || !(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const emailValue = body && typeof body === 'object' && 'email' in body ? body.email : null;
  if (!emailOk(emailValue)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }
  const email = emailValue.trim().toLowerCase();
  const temporaryPassword = randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(temporaryPassword, 12);
  try {
    const created = await query<{id: string; email: string; created_at: string}>(
      `INSERT INTO users (email, password_hash, admin_created)
       VALUES ($1, $2, TRUE)
       RETURNING id::text, email, created_at::text`,
      [email, hash]
    );
    // Do not log this response, send it through email, or include it in a URL.
    return NextResponse.json({
      user: { ...created.rows[0], disabled: false, email_verified_at: null, admin_created: true },
      temporaryPassword,
      message: 'Account created. Copy the temporary password now; it will not be shown again. Email is not verified.'
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if ((e as {code?:string}).code === '23505') {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 });
    }
    throw e;
  }
}
