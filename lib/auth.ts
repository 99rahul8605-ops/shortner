import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

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
export function cookieOptions(maxAge: number) {
  return { httpOnly: true as const, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge };
}

// The signed cookie binds a browser to a server-side visit. The public /s/ URL
// remains short; the 32-character route token only appears on article URLs.
export type Progress = {
  slug: string;
  step: number;
  startedAt: number;
  popupAt: number;
  nonce: string;
  routeToken: string;
  sessionId: string;
};
export type VisitStage = 'popup' | 'timing' | 'revealed' | 'final' | 'complete';
type VisitRow = {
  id: string; slug: string; step: number; stage: VisitStage;
  started_at: string | number; popup_at: string | number;
};
export type Visit = {
  id: string; slug: string; step: number; stage: VisitStage;
  startedAt: number; popupAt: number;
};
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function visitFromRow(row: VisitRow): Visit {
  return { id: row.id, slug: row.slug, step: row.step, stage: row.stage,
    startedAt: Number(row.started_at), popupAt: Number(row.popup_at) };
}
export async function signProgress(p: Progress) {
  return new SignJWT({ ...p, purpose: 'progress' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('20m').sign(secret());
}
export async function readProgress(): Promise<Progress | null> {
  const token = (await cookies()).get(visitorCookie)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== 'progress' || typeof payload.slug !== 'string' ||
        typeof payload.step !== 'number' || !Number.isInteger(payload.step) ||
        payload.step < 1 || payload.step > 4 ||
        typeof payload.startedAt !== 'number' || typeof payload.popupAt !== 'number' ||
        typeof payload.nonce !== 'string' ||
        typeof payload.routeToken !== 'string' || !/^[a-zA-Z0-9_-]{32}$/.test(payload.routeToken) ||
        typeof payload.sessionId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sessionId)) return null;
    return { slug: payload.slug, step: Number(payload.step), startedAt: payload.startedAt,
      popupAt: payload.popupAt, nonce: payload.nonce,
      routeToken: payload.routeToken, sessionId: payload.sessionId };
  } catch { return null; }
}

// Never trust the cookie's progress counters by themselves: every article,
// popup, Continue transition and final redirect checks this persisted row.
export async function loadVisit(p: Progress): Promise<Visit | null> {
  const r = await query<VisitRow>(
    `SELECT id, slug, step, stage, started_at, popup_at FROM visitor_sessions
     WHERE id=$1 AND slug=$2 AND step=$3 AND route_token_hash=$4
       AND expires_at > NOW() AND stage <> 'complete'`,
    [p.sessionId, p.slug, p.step, tokenHash(p.routeToken)]
  );
  return r.rows[0] ? visitFromRow(r.rows[0]) : null;
}

// Check the browser Origin against the configured PUBLIC origin rather than
// internal reverse-proxy URLs. Keep this strict for all POST endpoints.
export function correctOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const supplied = new URL(origin);
    if (!['https:', 'http:'].includes(supplied.protocol)) return false;
    const allowed = new Set<string>(['https://shortner-ajk5.onrender.com']);
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) allowed.add(new URL(configured).origin);
    if (process.env.NODE_ENV !== 'production') allowed.add(new URL(req.url).origin);
    return allowed.has(supplied.origin);
  } catch { return false; }
}
