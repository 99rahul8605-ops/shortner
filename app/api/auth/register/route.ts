import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {query} from '@/lib/db';
import {correctOrigin} from '@/lib/auth';
import {emailOk,usernameOk,passwordOk,throttle,requester,makeAccountToken,sendAccountEmail,siteUrl} from '@/lib/users';
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
   const r=await query<{id:string}>(
     'INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3) RETURNING id::text',
     [username,email,await bcrypt.hash(b.password,12)]);
   let emailNotice='Email delivery is not configured yet. You can sign in now, but recovery will only work after verifying your email.';
   if(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM){
     try{
       const token=await makeAccountToken(r.rows[0].id,'verify');
       await sendAccountEmail(email,'Verify your BingoLink recovery email',
         `<p>Confirm your recovery email:</p><p><a href="${siteUrl(req)}/verify?token=${token}">Verify email</a></p><p>Expires in 30 minutes.</p>`);
       emailNotice='Check your inbox to verify your recovery email. You can already sign in.';
     }catch(err){console.error('Recovery email delivery failed',err);emailNotice='Account created, but verification email could not be delivered. You can resend it later.';}
   }
   return NextResponse.json({message:'Account created. '+emailNotice},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Username or email already registered'},{status:409});throw e}
}
