import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { correctOrigin, isAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { emailOk, passwordOk, usernameOk } from '@/lib/users';

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
  const requestedUsername=body && typeof body==='object' && 'username' in body ? body.username : '';
  const username=typeof requestedUsername==='string' && requestedUsername.trim() ? requestedUsername.trim().toLowerCase() : 'test_'+randomBytes(6).toString('hex');
  if(!usernameOk(username))return NextResponse.json({error:'Username must be 3–30 letters, numbers or underscores and start with a letter'},{status:400});
  const supplied = body && typeof body === 'object' && 'password' in body ? body.password : undefined;
  if (supplied!==undefined && !passwordOk(supplied)) return NextResponse.json({error:'Password must be 8–128 characters'},{status:400});
  const temporaryPassword = typeof supplied==='string' ? supplied : randomBytes(18).toString('base64url');
  const hash = await bcrypt.hash(temporaryPassword, 12);
  try {
    const created = await query<{id: string; username: string; email: string; created_at: string}>(
      `INSERT INTO users (username, email, password_hash, admin_created)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id::text, username, email, created_at::text`,
      [username,email,hash]
    );
    // Do not log this response, send it through email, or include it in a URL.
    return NextResponse.json({
      user: { ...created.rows[0], disabled: false, email_verified_at: null, admin_created: true },
      temporaryPassword,
      message: 'Account approved for testing. Email ownership has not been verified.'
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    if ((e as {code?:string}).code === '23505') {
      return NextResponse.json({ error: 'Username or email already registered' }, { status: 409 });
    }
    throw e;
  }
}
