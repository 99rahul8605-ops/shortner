import {NextResponse} from 'next/server';
import {correctOrigin,isAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
export const runtime='nodejs';
function validUrl(raw:unknown){if(typeof raw!=='string'||raw.length>2048)return false;try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false}}
export async function POST(req:Request){if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});const b=await req.json().catch(()=>({}));if(!validUrl(b.url)||typeof b.label!=='string'||!b.label.trim()||b.label.length>100)return NextResponse.json({error:'Enter a label and a valid HTTPS Direct Link URL'},{status:400});const r=await query('INSERT INTO direct_links(label,url,enabled) VALUES($1,$2,TRUE) RETURNING id,label,url,enabled',[b.label.trim(),b.url]);return NextResponse.json({link:r.rows[0]});}
