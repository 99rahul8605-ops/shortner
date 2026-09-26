import {NextResponse} from 'next/server';import {isAdmin,correctOrigin} from '@/lib/auth';import {db,query} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});const r=await query(`SELECT p.id::text,p.amount_cents::text,p.status,p.requested_at::text,u.email,p.admin_note FROM payout_requests p JOIN users u ON u.id=p.user_id ORDER BY p.id DESC LIMIT 100`);return NextResponse.json({requests:r.rows},{headers:{'Cache-Control':'no-store'}})}
export async function PATCH(req:Request){
 if(!correctOrigin(req)||!(await isAdmin()))return NextResponse.json({error:'Forbidden'},{status:403});
 const b=await req.json().catch(()=>({}));if(!/^[1-9][0-9]*$/.test(String(b.id||''))||!['paid','rejected'].includes(b.status)||typeof b.note!=='string'||b.note.length>500)return NextResponse.json({error:'Invalid request'},{status:400});
 const client=await db().connect();try{await client.query('BEGIN');const r=await client.query(`UPDATE payout_requests SET status=$2,admin_note=$3,reviewed_at=NOW() WHERE id=$1 AND status='requested' RETURNING id`,[b.id,b.status,b.note]);if(!r.rowCount){await client.query('ROLLBACK');return NextResponse.json({error:'Request already processed or not found'},{status:409})}await client.query('COMMIT');return NextResponse.json({ok:true})}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
