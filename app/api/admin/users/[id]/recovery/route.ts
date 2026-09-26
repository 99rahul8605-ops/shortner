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
 const r=await query<{id:string;email:string}>(
   'SELECT id::text,email FROM users WHERE id=$1 AND disabled=FALSE',[id]);
 const u=r.rows[0];if(!u)return NextResponse.json({error:'User not found'},{status:404});
 const token=await makeAccountToken(u.id,'reset');
 const url=`${siteUrl(req)}/reset-password?token=${token}`;
 try{await sendAccountEmail(u.email,'BingoLink password recovery',
   `<p>Use this one-time link to choose a new password:</p><p><a href="${url}">Reset password</a></p><p>Expires in 30 minutes. Ignore this email if you did not request a password reset.</p>`)}
 catch(err){console.error('Admin recovery delivery failed',err);return NextResponse.json({error:'Email delivery failed'},{status:503});}
 return NextResponse.json({ok:true,message:'Password-reset link sent to the account recovery email.'});
}
