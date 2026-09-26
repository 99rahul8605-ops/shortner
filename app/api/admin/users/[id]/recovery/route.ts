import {NextResponse} from 'next/server';
import {correctOrigin,isAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
import {makeAccountToken,sendAccountEmail,siteUrl} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});
 const {id}=await params;
 if(!/^\d+$/.test(id))return NextResponse.json({error:'Invalid user'},{status:400});
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)
   return NextResponse.json({error:'Configure RESEND_API_KEY and EMAIL_FROM first'},{status:503});
 const r=await query<{id:string;email:string;email_verified_at:string|null}>(
   'SELECT id::text,email,email_verified_at::text FROM users WHERE id=$1 AND disabled=FALSE',[id]);
 const u=r.rows[0];if(!u)return NextResponse.json({error:'User not found'},{status:404});
 const purpose=u.email_verified_at?'reset':'verify';
 const token=await makeAccountToken(u.id,purpose);
 const url=u.email_verified_at?`${siteUrl(req)}/reset-password?token=${token}`:`${siteUrl(req)}/verify?token=${token}`;
 try{await sendAccountEmail(u.email,u.email_verified_at?'BingoLink account recovery':'Verify your BingoLink recovery email',
   `<p>${u.email_verified_at?'Use this one-time link to set a new password:':'Confirm your email for future password recovery:'}</p><p><a href="${url}">${u.email_verified_at?'Reset password':'Verify email'}</a></p><p>Expires in 30 minutes.</p>`)}
 catch(err){console.error('Admin recovery delivery failed',err);return NextResponse.json({error:'Email delivery failed'},{status:503});}
 return NextResponse.json({ok:true,message:u.email_verified_at?'Password-reset link sent to verified recovery email.':'Email verification link sent. The user must verify ownership before password recovery.'});
}
