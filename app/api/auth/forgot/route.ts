import {NextResponse} from 'next/server';
import {query} from '@/lib/db';
import {correctOrigin} from '@/lib/auth';
import {emailOk,throttle,requester,makeAccountToken,sendAccountEmail,siteUrl} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 if(!await throttle('forgot:'+requester(req),4,3600))return NextResponse.json({error:'Try again later'},{status:429});
 const b=await req.json().catch(()=>({}));
 if(!emailOk(b.email))return NextResponse.json({error:'Enter your recovery email'},{status:400});
 const email=b.email.trim().toLowerCase();
 const generic='If an account uses this email, a one-time password-reset link will be sent.';
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return NextResponse.json({error:'Recovery email is temporarily unavailable. Contact support.'},{status:503});
 const r=await query<{id:string}>(`SELECT id::text FROM users WHERE lower(email)=$1 AND disabled=FALSE`,[email]);
 if(r.rows[0]){
   const token=await makeAccountToken(r.rows[0].id,'reset');
   try{await sendAccountEmail(email,'Reset your BingoLink password',
     `<p>Use this secure, one-time link to choose a new password:</p><p><a href="${siteUrl(req)}/reset-password?token=${token}">Reset password</a></p><p>Expires in 30 minutes. Ignore this message if you did not request it.</p>`)}
   catch(err){console.error('Password recovery email failed',err);return NextResponse.json({error:'Email delivery unavailable; try again later.'},{status:503});}
 }
 return NextResponse.json({message:generic});
}
