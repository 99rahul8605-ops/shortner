import {NextResponse} from 'next/server';import {isAdmin,correctOrigin} from '@/lib/auth';import {query} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
 const [users,totals,entries]=await Promise.all([
  query(`SELECT id::text,email FROM users WHERE disabled=FALSE ORDER BY id DESC LIMIT 300`),
  query(`SELECT COALESCE(SUM(gross_cents),0)::text gross,COALESCE(SUM(user_cents),0)::text users,COALESCE(SUM(impressions),0)::text impressions FROM revenue_entries`),
  query(`SELECT r.id::text,r.revenue_date::text date,u.email,r.zone_id,r.sub_id,r.evidence_ref,r.gross_cents::text,r.user_cents::text,r.impressions::text FROM revenue_entries r JOIN users u ON r.user_id=u.id ORDER BY r.id DESC LIMIT 100`)]);
 return NextResponse.json({users:users.rows,totals:totals.rows[0],entries:entries.rows},{headers:{'Cache-Control':'no-store'}})
}
export async function POST(req:Request){
 if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json().catch(()=>({}));
 if(!/^[1-9][0-9]*$/.test(String(b.userId||''))||!/^\d{4}-\d{2}-\d{2}$/.test(b.date||'')||!/^\d{4,15}$/.test(b.zoneId||'')||typeof b.subId!=='string'||!/^[-_a-zA-Z0-9]{1,100}$/.test(b.subId)||typeof b.evidenceRef!=='string'||b.evidenceRef.length<8||b.evidenceRef.length>200||!Number.isSafeInteger(b.grossCents)||b.grossCents<0||!Number.isSafeInteger(b.impressions)||b.impressions<0)
  return NextResponse.json({error:'Valid user, date, zone, SubID, unique evidence reference, gross cents and impressions required'},{status:400});
 // Admin confirms this provider-reported amount is attributable to this user; no visit-based estimates.
 try{
  const r=await query(`INSERT INTO revenue_entries(user_id,revenue_date,zone_id,sub_id,evidence_ref,gross_cents,impressions)
  SELECT id,$2,$3,$4,$5,$6,$7 FROM users WHERE id=$1 RETURNING id::text,user_cents::text`,[b.userId,b.date,b.zoneId,b.subId,b.evidenceRef.trim(),b.grossCents,b.impressions]);
  if(!r.rowCount)return NextResponse.json({error:'User not found'},{status:404});return NextResponse.json({entry:r.rows[0]});
 }catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'This provider report has already been credited'},{status:409});throw e}
}
