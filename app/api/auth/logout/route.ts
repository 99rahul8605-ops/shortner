import {NextResponse} from 'next/server';import{correctOrigin}from '@/lib/auth';import{accountCookie}from '@/lib/users';
export async function POST(req:Request){if(!correctOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});const r=NextResponse.json({ok:true});r.cookies.delete(accountCookie);return r;}
