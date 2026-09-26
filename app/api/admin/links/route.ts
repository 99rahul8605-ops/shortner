import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isAdmin,correctOrigin } from '@/lib/auth';
import { query } from '@/lib/db';
export const runtime='nodejs';
export async function POST(req:Request){if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});const b=await req.json().catch(()=>({}));if(typeof b.destination!=='string'|| b.destination.length>2048)return NextResponse.json({error:'Invalid URL'},{status:400});
let destination:string;try{const u=new URL(b.destination);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();destination=u.toString()}catch{return NextResponse.json({error:'Use a valid http or https destination without credentials'},{status:400})}
const title=typeof b.title==='string'?b.title.trim().slice(0,150):'';
const slug=typeof b.slug==='string'&&b.slug.trim()?b.slug.trim().toLowerCase():randomBytes(5).toString('hex');
if(!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(slug))return NextResponse.json({error:'Alias must be 3–40 characters (a-z, 0-9, - or _)'},{status:400});
try{const r=await query('INSERT INTO links(slug,destination,title) VALUES($1,$2,$3) RETURNING id,slug,destination,title,enabled,created_at::text',[slug,destination,title]);return NextResponse.json({link:r.rows[0]})}catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Alias already used'},{status:409});throw e}}
