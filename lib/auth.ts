import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
const adminCookie = 'bl_admin';
const visitorCookie = 'bl_progress';
function secret() {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) throw new Error('APP_SECRET must be at least 32 characters');
  return new TextEncoder().encode(s);
}
export async function signAdmin() {
  return new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret());
}
export async function isAdmin() {
  const token = (await cookies()).get(adminCookie)?.value;
  if (!token) return false;
  try { const data = await jwtVerify(token, secret()); return data.payload.role === 'admin'; } catch { return false; }
}
export const adminCookieName = adminCookie;
export const progressCookieName = visitorCookie;
export function cookieOptions(maxAge: number) { return { httpOnly: true as const, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge }; }
export type Progress = { slug: string; step: number; startedAt: number; popupAt: number; nonce: string };
export async function signProgress(p: Progress) {
  return new SignJWT({ ...p, purpose: 'progress' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('20m').sign(secret());
}
export async function readProgress(): Promise<Progress|null> {
  const token = (await cookies()).get(visitorCookie)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== 'progress' || typeof payload.slug !== 'string' || typeof payload.step !== 'number' || typeof payload.startedAt !== 'number' || typeof payload.popupAt !== 'number' || typeof payload.nonce !== 'string') return null;
    return {slug: payload.slug, step: payload.step, startedAt: payload.startedAt, popupAt: payload.popupAt, nonce: payload.nonce};
  } catch { return null; }
}
export function correctOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const allowedSite = process.env.NEXT_PUBLIC_SITE_URL;
    if (!allowedSite) return false;
    return new URL(origin).origin === new URL(allowedSite).origin;
  } catch {
    return false;
  }
}
