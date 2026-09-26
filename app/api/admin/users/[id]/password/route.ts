import {NextResponse} from 'next/server';
import {randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {correctOrigin,isAdmin} from '@/lib/auth';
import {query} from '@/lib/db';
import {passwordOk} from '@/lib/users';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});
 const {id}=await params;if(!/^\d+$/.test(id))return NextResponse.json({error:'Invalid user'},{status:400});
 const body=await req.json().catch(()=>({}));const password=body.password===undefined||body.password===''?randomBytes(18).toString('base64url'):body.password;
 if(!passwordOk(password))return NextResponse.json({error:'Password must be 6–128 characters'},{status:400});
 const result=await query('UPDATE users SET password_hash=$1,session_version=session_version+1 WHERE id=$2 AND admin_created=TRUE RETURNING id',[await bcrypt.hash(password,12),id]);
 if(!result.rowCount)return NextResponse.json({error:'Only admin-created test account passwords can be reset here'},{status:404});
 return NextResponse.json({password},{headers:{'Cache-Control':'no-store'}});
}
