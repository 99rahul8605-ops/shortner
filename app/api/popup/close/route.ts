import {NextResponse} from 'next/server';
import {readProgress,signProgress,progressCookieName,cookieOptions,correctOrigin} from '@/lib/auth';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
 const body=await req.json().catch(()=>({}));const p=await readProgress();
 if(!p||p.slug!==body.slug||p.step!==body.step||p.routeToken!==body.vt)return NextResponse.json({error:'Session expired. Open the short link again.'},{status:403});
 if(p.startedAt>0)return NextResponse.json({startedAt:p.startedAt},{headers:{'Cache-Control':'no-store'}});
 if(Date.now()-p.popupAt<15000)return NextResponse.json({error:'Please wait before closing the popup'},{status:429});
 const startedAt=Date.now();const response=NextResponse.json({startedAt},{headers:{'Cache-Control':'no-store'}});
 response.cookies.set(progressCookieName,await signProgress({...p,startedAt}),cookieOptions(1200));return response;
}
