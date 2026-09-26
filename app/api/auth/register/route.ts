import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {query} from '@/lib/db';
import {correctOrigin,cookieOptions} from '@/lib/auth';
import {emailOk,usernameOk,passwordOk,throttle,requester,accountCookie,userToken} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 if(!await throttle('register:'+requester(req),5,3600))return NextResponse.json({error:'Try again later'},{status:429});
 const b=await req.json().catch(()=>({}));
 const username=typeof b.username==='string'?b.username.trim().toLowerCase():'';
 if(!usernameOk(username)||!emailOk(b.email)||!passwordOk(b.password))
   return NextResponse.json({error:'Username: 3–30 lowercase letters, numbers or underscore (start with a letter). Valid email and 8–128 character password required.'},{status:400});
 const email=b.email.trim().toLowerCase();
 try{
   const r=await query<{id:string;session_version:number}>(
     'INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3) RETURNING id::text,session_version',
     [username,email,await bcrypt.hash(b.password,12)]);
   const response=NextResponse.json({message:'Account created. You are signed in.',ok:true},{status:201,headers:{'Cache-Control':'no-store'}});
   response.cookies.set(accountCookie,await userToken(r.rows[0].id,r.rows[0].session_version),cookieOptions(604800));
   return response;
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Username or email already registered'},{status:409});throw e}
}
