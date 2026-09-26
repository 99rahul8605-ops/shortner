import { query } from '@/lib/db';

export type EarningsSummary = {
  earnedCents: number; pendingCents: number; paidCents: number;
  availableCents: number; impressions: number; ecpm: number|null;
};

type Totals = {earned:string; impressions:string; paid:string; pending:string};
export async function earningsForUser(userId: string): Promise<EarningsSummary> {
  const r=await query<Totals>(`SELECT
    COALESCE((SELECT SUM(user_cents) FROM revenue_entries WHERE user_id=$1),0)::text AS earned,
    COALESCE((SELECT SUM(impressions) FROM revenue_entries WHERE user_id=$1),0)::text AS impressions,
    COALESCE((SELECT SUM(amount_cents) FROM payout_requests WHERE user_id=$1 AND status='paid'),0)::text AS paid,
    COALESCE((SELECT SUM(amount_cents) FROM payout_requests WHERE user_id=$1 AND status='requested'),0)::text AS pending`,[userId]);
  const x=r.rows[0];const earnedCents=Number(x.earned), paidCents=Number(x.paid),pendingCents=Number(x.pending), impressions=Number(x.impressions);
  return {earnedCents,paidCents,pendingCents,availableCents:Math.max(0,earnedCents-paidCents-pendingCents),impressions,ecpm:impressions>0?earnedCents/100/impressions*1000:null};
}
export const dollars=(cents:number)=>(cents/100).toFixed(2);
