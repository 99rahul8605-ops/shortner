import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { adminCookieName, cookieOptions, correctOrigin, signAdmin } from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
  if(!correctOrigin(req)) return NextResponse.json({error:'Invalid request origin'}, {status:403});
  const body=await req.json().catch(()=>({}));
  const name=typeof body.username==='string'?body.username:'';
  const pw=typeof body.password==='string'?body.password:'';
  if(pw.length>512) return NextResponse.json({error:'Invalid credentials'}, {status:401});
  const expected=process.env.ADMIN_PASSWORD_HASH;
  // Do not reveal which credential failed.
  if(!expected || name!==(process.env.ADMIN_USERNAME||'admin') || !(await bcrypt.compare(pw,expected))) return NextResponse.json({error:'Invalid credentials'}, {status:401});
  const res=NextResponse.json({ok:true});res.cookies.set(adminCookieName,await signAdmin(),cookieOptions(7*24*3600));return res;
}
