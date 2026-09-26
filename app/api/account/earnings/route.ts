import {NextResponse} from 'next/server';
import {currentUser} from '@/lib/users';
import {earningsForUser} from '@/lib/earnings';
import {query} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 const u=await currentUser();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});
 const [summary,entries,payouts]=await Promise.all([
  earningsForUser(u.id),
  query(`SELECT revenue_date::text AS date,user_cents::text AS cents,impressions::text AS impressions FROM revenue_entries WHERE user_id=$1 ORDER BY revenue_date DESC,id DESC LIMIT 90`,[u.id]),
  query(`SELECT id::text,amount_cents::text AS cents,status,requested_at::text AS date FROM payout_requests WHERE user_id=$1 ORDER BY id DESC LIMIT 40`,[u.id])]);
 return NextResponse.json({summary,entries:entries.rows,payouts:payouts.rows},{headers:{'Cache-Control':'no-store'}});
}
