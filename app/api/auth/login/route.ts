import {NextResponse} from 'next/server';
import {correctOrigin,cookieOptions} from '@/lib/auth';
import {accountCookie,emailOk,throttle,requester,userToken,verifyPassword} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const b=await req.json().catch(()=>({}));if(!emailOk(b.email)||typeof b.password!=='string'||b.password.length>128)return NextResponse.json({error:'Invalid credentials'},{status:401});
 if(!await throttle('signin:'+requester(req),10,900))return NextResponse.json({error:'Too many attempts. Try later.'},{status:429});
 const user=await verifyPassword(b.email.trim(),b.password);if(!user)return NextResponse.json({error:'Invalid credentials'},{status:401});
 if(!user.email_verified_at)return NextResponse.json({error:'Verify your email first'},{status:403});
 const r=NextResponse.json({ok:true});r.cookies.set(accountCookie,await userToken(user.id,user.session_version),cookieOptions(604800));return r;}
