import {NextResponse} from 'next/server';
import {correctOrigin} from '@/lib/auth';
import {query} from '@/lib/db';
import {emailOk,requester,throttle,makeAccountToken,sendAccountEmail,siteUrl} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 if(!await throttle('resend:'+requester(req),3,3600))return NextResponse.json({error:'Try again later'},{status:429});
 const b=await req.json().catch(()=>({}));if(!emailOk(b.email))return NextResponse.json({error:'Invalid email'},{status:400});
 const r=await query<{id:string}>('SELECT id::text FROM users WHERE email=$1 AND disabled=FALSE AND email_verified_at IS NULL',[b.email.trim().toLowerCase()]);
 if(r.rows[0]&&process.env.RESEND_API_KEY&&process.env.EMAIL_FROM){
  const tok=await makeAccountToken(r.rows[0].id,'verify');await sendAccountEmail(b.email.trim().toLowerCase(),'Verify your BingoLink email',`<p><a href="${siteUrl(req)}/verify?token=${tok}">Verify email</a></p><p>Expires in 30 minutes.</p>`);
 }
 return NextResponse.json({message:'If verification is pending, a new email will be sent.'});
}
