import {NextRequest,NextResponse}from 'next/server';
import {createHash,createHmac,randomBytes}from 'node:crypto';
import {getLink}from '@/lib/data';import{query}from '@/lib/db';import{signProgress,progressCookieName,cookieOptions}from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:NextRequest,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!/^[a-z0-9_-]{3,40}$/.test(slug))return new NextResponse('Link not found',{status:404});const l=await getLink(slug);if(!l||!l.enabled)return new NextResponse('Link unavailable',{status:404});
// Store non-reversible keyed IP hash; no raw IP in the database.
const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||'';
const key=process.env.APP_SECRET||'';
const ipHash=ip?createHmac('sha256',key).update(ip).digest('hex'):null;
const ua=req.headers.get('user-agent')||'';const uaHash=ua?createHash('sha256').update(ua).digest('hex'):null;
const country=(req.headers.get('cf-ipcountry')||'').slice(0,3);
await query('INSERT INTO visits(link_id,ip_hash,ua_hash,country) SELECT id,$1,$2,$3 FROM links WHERE slug=$4',[ipHash,uaHash,country||null,slug]);
const routeToken=randomBytes(24).toString('base64url');
const token=await signProgress({slug,step:1,startedAt:0,popupAt:Date.now(),nonce:randomBytes(32).toString('hex'),routeToken});
const next=new URL(`/go/${encodeURIComponent(slug)}/1`,req.url);next.searchParams.set('vt',routeToken);
const r=NextResponse.redirect(next,302);r.cookies.set(progressCookieName,token,cookieOptions(1200));r.headers.set('Cache-Control','no-store');return r;}
