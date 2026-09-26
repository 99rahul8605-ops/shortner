import {NextResponse} from 'next/server';import {isAdmin} from '@/lib/auth';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(req:Request){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 const key=process.env.HILLTOPADS_API_KEY;if(!key)return NextResponse.json({error:'HILLTOPADS_API_KEY not configured'},{status:503});
 const qs=new URL(req.url).searchParams;const date=qs.get('date')||'';const date2=qs.get('date2')||date;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{4}-\d{2}-\d{2}$/.test(date2)||date2<date)return NextResponse.json({error:'Specify valid date/date2'},{status:400});
 const url=new URL('https://api.hilltopads.com/publisher/listStats');url.searchParams.set('key',key);url.searchParams.set('date',date);url.searchParams.set('date2',date2);url.searchParams.set('group','date,subId,zoneId');
 try{const r=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)return NextResponse.json({error:'Provider returned HTTP '+r.status},{status:502});
 const data:unknown=await r.json();return NextResponse.json({report:data,note:'Provider report for admin review only. Entries are not auto-credited until verified attribution.'},{headers:{'Cache-Control':'no-store'}})}catch{return NextResponse.json({error:'Provider API unavailable'},{status:502})}
}
