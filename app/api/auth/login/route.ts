import {NextResponse} from 'next/server';
import {correctOrigin,cookieOptions} from '@/lib/auth';
import {accountCookie,throttle,requester,userToken,verifyPassword} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const b=await req.json().catch(()=>({}));
 const identifier=typeof b.username==='string'?b.username:typeof b.email==='string'?b.email:'';
 if(!identifier.trim()||identifier.length>254||typeof b.password!=='string'||b.password.length>128)
   return NextResponse.json({error:'Invalid credentials'},{status:401});
 if(!await throttle('signin:'+requester(req),10,900))return NextResponse.json({error:'Too many attempts. Try later.'},{status:429});
 const user=await verifyPassword(identifier,b.password);
 if(!user)return NextResponse.json({error:'Invalid credentials'},{status:401});
 // Email verification is for secure recovery, not a login gate.
 const r=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 r.cookies.set(accountCookie,await userToken(user.id,user.session_version),cookieOptions(604800));
 return r;
}
