import {NextResponse}from 'next/server';
import{readProgress,signProgress,progressCookieName,cookieOptions,correctOrigin}from '@/lib/auth';
import{getLink,getSettings,seconds}from '@/lib/data';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:Request){if(!correctOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});const b=await req.json().catch(()=>({}));const progress=await readProgress();if(!progress||progress.slug!==b.slug||progress.step!==b.step)return NextResponse.json({error:'Session expired. Reopen your short link.'},{status:403});const l=await getLink(progress.slug);if(!l||!l.enabled)return NextResponse.json({error:'Link unavailable'},{status:404});
const settings=await getSettings();const wait=seconds(settings,progress.step)*1000;if(Date.now()-progress.startedAt<wait)return NextResponse.json({error:'Countdown is not finished'},{status:429});
if(progress.step===4){const r=NextResponse.json({next:l.destination});r.cookies.delete(progressCookieName);r.headers.set('Cache-Control','no-store');return r;}
const nextStep=progress.step+1;const token=await signProgress({...progress,step:nextStep,startedAt:Date.now()});const r=NextResponse.json({next:`/go/${encodeURIComponent(progress.slug)}/${nextStep}`});r.cookies.set(progressCookieName,token,cookieOptions(1200));r.headers.set('Cache-Control','no-store');return r;}
