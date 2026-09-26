import { NextResponse } from 'next/server';
import {adminCookieName,correctOrigin} from '@/lib/auth';
export async function POST(req:Request){if(!correctOrigin(req))return new NextResponse('Forbidden',{status:403});const r=NextResponse.json({ok:true});r.cookies.delete(adminCookieName);return r;}
