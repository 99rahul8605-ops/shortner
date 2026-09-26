import {query} from '@/lib/db';
import {currentUser,sha,throttle,requester,validUrl} from '@/lib/users';
import {randomBytes} from 'node:crypto';
import {NextResponse} from 'next/server';
import {correctOrigin} from '@/lib/auth';
export async function apiUser(req:Request){
 const a=req.headers.get('authorization')||'';if(!a.startsWith('Bearer bl_live_'))return null;
 const raw=a.slice(7);if(!/^bl_live_[a-f0-9]{64}$/.test(raw))return null;
 const r=await query<{user_id:string}>(`SELECT k.user_id::text FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.key_hash=$1 AND k.revoked_at IS NULL AND u.disabled=FALSE `,[sha(raw)]);
 if(!r.rows[0])return null;
 await query('UPDATE api_keys SET last_used_at=NOW() WHERE key_hash=$1',[sha(raw)]);
 return r.rows[0].user_id;
}
export async function userOrKey(req:Request){
 const a=req.headers.get('authorization');if(a)return apiUser(req);
 if(!correctOrigin(req))return null;
 const u=await currentUser();return u?u.id:null;
}
export async function createLink(owner:string,body:Record<string,unknown>){
 const destination=validUrl(body.destination);if(!destination)return NextResponse.json({error:'Valid HTTP(S) destination required'},{status:400});
 const title=typeof body.title==='string'?body.title.trim().slice(0,150):'';
 const slug=typeof body.slug==='string'&&body.slug.trim()?body.slug.trim().toLowerCase():randomBytes(5).toString('hex');
 if(!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(slug))return NextResponse.json({error:'Alias must be 3–40 lowercase characters'},{status:400});
 try{const r=await query('INSERT INTO links(slug,destination,title,owner_id) VALUES($1,$2,$3,$4) RETURNING id::text,slug,destination,title,enabled,created_at',[slug,destination,title,owner]);return NextResponse.json({link:{...r.rows[0],short_url:`${process.env.NEXT_PUBLIC_SITE_URL||''}/s/${slug}`}},{status:201})}
 catch(e){if((e as {code?:string}).code==='23505')return NextResponse.json({error:'Alias already taken'},{status:409});throw e}
}
export {throttle,requester};
