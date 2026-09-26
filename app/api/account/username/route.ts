import {NextResponse} from 'next/server';
import {currentUser,usernameOk} from '@/lib/users';
import {correctOrigin} from '@/lib/auth';
import {query} from '@/lib/db';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const u=await currentUser();if(!u)return NextResponse.json({error:'Sign in required'},{status:401});
 if(u.username)return NextResponse.json({error:'Username already set; contact support to change it'},{status:409});
 const b=await req.json().catch(()=>({}));const username=typeof b.username==='string'?b.username.trim().toLowerCase():'';
 if(!usernameOk(username))return NextResponse.json({error:'Username must start with a letter and contain 3–30 lowercase letters, numbers or underscores'},{status:400});
 try{const r=await query('UPDATE users SET username=$1 WHERE id=$2 AND username IS NULL RETURNING id',[username,u.id]);if(!r.rowCount)return NextResponse.json({error:'Username already set'},{status:409});return NextResponse.json({username});}
 catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Username already in use'},{status:409});throw e}
}
