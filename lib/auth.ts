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
export type Progress = { slug: string; step: number; startedAt: number; popupAt: number; nonce: string; routeToken: string };
export async function signProgress(p: Progress) {
  return new SignJWT({ ...p, purpose: 'progress' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('20m').sign(secret());
}
export async function readProgress(): Promise<Progress|null> {
  const token = (await cookies()).get(visitorCookie)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== 'progress' || typeof payload.slug !== 'string' || typeof payload.step !== 'number' || typeof payload.startedAt !== 'number' || typeof payload.popupAt !== 'number' || typeof payload.nonce !== 'string' || typeof payload.routeToken !== 'string' || !/^[a-zA-Z0-9_-]{32}$/.test(payload.routeToken)) return null;
    return {slug: payload.slug, step: payload.step, startedAt: payload.startedAt, popupAt: payload.popupAt, nonce: payload.nonce, routeToken: payload.routeToken};
  } catch { return null; }
}
// Check the browser's Origin against configured public origins, not the
// internal request URL: reverse proxies (including Render) rewrite req.url.
export function correctOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const supplied = new URL(origin);
    if (!['https:', 'http:'].includes(supplied.protocol)) return false;
    const allowed = new Set<string>(['https://shortner-ajk5.onrender.com']);
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) allowed.add(new URL(configured).origin);
    // Local development only; never trust forwarded-host headers from clients.
    if (process.env.NODE_ENV !== 'production') allowed.add(new URL(req.url).origin);
    return allowed.has(supplied.origin);
  } catch { return false; }
}
