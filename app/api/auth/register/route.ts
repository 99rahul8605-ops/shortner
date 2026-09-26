import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {query} from '@/lib/db';
import {correctOrigin} from '@/lib/auth';
import {emailOk,passwordOk,throttle,requester,makeAccountToken,sendAccountEmail,siteUrl} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 if(!await throttle('register:'+requester(req),5,3600))return NextResponse.json({error:'Try again later'},{status:429});
 const b=await req.json().catch(()=>({}));if(!emailOk(b.email)||!passwordOk(b.password))return NextResponse.json({error:'Valid email and 8–128 character password required'},{status:400});
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return NextResponse.json({error:'Registration temporarily unavailable: email delivery not configured'},{status:503});
 const email=b.email.trim().toLowerCase();
 try{const r=await query<{id:string}>('INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id::text',[email,await bcrypt.hash(b.password,12)]);
 const token=await makeAccountToken(r.rows[0].id,'verify');await sendAccountEmail(email,'Verify your BingoLink email',`<p>Confirm your account:</p><p><a href="${siteUrl(req)}/verify?token=${token}">Verify email</a></p><p>Expires in 30 minutes.</p>`);
 return NextResponse.json({message:'Check your inbox for the verification email'},{status:201});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({message:'If the address is eligible, follow its existing verification or reset flow'},{status:200});throw e}
}
