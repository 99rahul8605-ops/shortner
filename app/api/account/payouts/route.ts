import {NextResponse} from 'next/server';
import {correctOrigin} from '@/lib/auth';import {currentUser} from '@/lib/users';
import {db} from '@/lib/db';
export const runtime='nodejs';
export async function POST(req:Request){
 if(!correctOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const u=await currentUser();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});
 const data=await req.json().catch(()=>({}));
 if(!Number.isSafeInteger(data.amountCents)||data.amountCents<1000)return NextResponse.json({error:'Minimum request is $10'},{status:400});
 const client=await db().connect();
 try{
  await client.query('BEGIN');
  await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[u.id]);
  const totals=await client.query<{earned:string;reserved:string}>(`SELECT
   COALESCE((SELECT SUM(user_cents) FROM revenue_entries WHERE user_id=$1),0)::text AS earned,
   COALESCE((SELECT SUM(amount_cents) FROM payout_requests WHERE user_id=$1 AND status IN ('requested','paid')),0)::text AS reserved`,[u.id]);
  const available=Number(totals.rows[0].earned)-Number(totals.rows[0].reserved);
  if(data.amountCents>available){await client.query('ROLLBACK');return NextResponse.json({error:'Insufficient available balance'},{status:400})}
  await client.query('INSERT INTO payout_requests(user_id,amount_cents) VALUES($1,$2)',[u.id,data.amountCents]);
  await client.query('COMMIT');return NextResponse.json({ok:true});
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
