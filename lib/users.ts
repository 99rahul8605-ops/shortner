import {createHash,randomBytes,createHmac} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {SignJWT,jwtVerify} from 'jose';
import {cookies} from 'next/headers';
import {query} from '@/lib/db';
import {cookieOptions} from '@/lib/auth';
export const accountCookie='bl_user';
export type User={id:string;username:string|null;email:string;email_verified_at:string|null;admin_created:boolean;disabled:boolean;session_version:number};
const secret=()=>{const s=process.env.APP_SECRET;if(!s||s.length<32)throw Error('APP_SECRET missing');return new TextEncoder().encode(s)};
export const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
export async function currentUser():Promise<User|null>{
 const token=(await cookies()).get(accountCookie)?.value;if(!token)return null;
 try{const {payload}=await jwtVerify(token,secret());if(payload.kind!=='user'||!/^\d+$/.test(String(payload.sub)))return null;
 const r=await query<User>('SELECT id::text,username,email,email_verified_at::text,admin_created,disabled,session_version FROM users WHERE id=$1',[payload.sub]);return r.rows[0]&&!r.rows[0].disabled&&payload.ver===r.rows[0].session_version?r.rows[0]:null}catch{return null}
}
export async function userToken(id:string,ver:number){return new SignJWT({kind:'user',ver}).setSubject(id).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret())}
export function emailOk(s:unknown):s is string{return typeof s==='string'&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)}
export function usernameOk(s:unknown):s is string{return typeof s==='string'&&/^[a-z][a-z0-9_]{2,29}$/.test(s)}
export function passwordOk(s:unknown):s is string{return typeof s==='string'&&s.length>=8&&s.length<=128}
export function validUrl(s:unknown){if(typeof s!=='string'||s.length>2048)return null;try{const u=new URL(s);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||/^(localhost|.*\.localhost|.*\.local)$/i.test(u.hostname))return null;return u.toString()}catch{return null}}
export async function throttle(bucket:string,limit:number,secs:number){
 const k=createHmac('sha256',process.env.APP_SECRET||'').update(bucket).digest('hex');
 const r=await query<{hits:number}>(`INSERT INTO request_limits(bucket,hits,expires_at) VALUES($1,1,NOW()+($2 || ' seconds')::interval)
 ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN request_limits.expires_at<NOW() THEN 1 ELSE request_limits.hits+1 END,
 expires_at=CASE WHEN request_limits.expires_at<NOW() THEN NOW()+($2 || ' seconds')::interval ELSE request_limits.expires_at END RETURNING hits`,[k,secs]);
 return r.rows[0].hits<=limit;
}
export function requester(req:Request){return req.headers.get('x-real-ip')||req.headers.get('cf-connecting-ip')||'unknown'}
export async function makeAccountToken(id:string,purpose:'verify'|'reset'){
 const raw=randomBytes(32).toString('hex');await query('INSERT INTO account_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL \'30 minutes\')',[id,purpose,sha(raw)]);return raw;
}
export async function sendAccountEmail(to:string,subject:string,html:string){
 const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;
 if(!key||!from)throw Error('Email provider not configured: RESEND_API_KEY and EMAIL_FROM required');
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to,subject,html})});
 if(!r.ok)throw Error('Email provider rejected request');
}
export function siteUrl(req:Request){const env=process.env.NEXT_PUBLIC_SITE_URL;return (env||new URL(req.url).origin).replace(/\/$/,'')}
// Usernames are unique case-insensitively. Legacy accounts can still use email.
// Do not expose whether a username/email exists from the public login endpoint.
export async function verifyPassword(identifier:string,pw:string){
 const name=identifier.trim().toLowerCase();
 const r=await query<User & {password_hash:string}>(
   `SELECT id::text,username,email,password_hash,email_verified_at::text,admin_created,disabled,session_version
    FROM users WHERE lower(username)=$1 OR lower(email)=$1 LIMIT 1`,[name]);
 const u=r.rows[0];
 const dummy='$2a$12$S5SQtH/5iOfIGSBl.TXxEuEp.sBkDd1t38kSMm/xOWznsuY1SlOUi';
 const valid=await bcrypt.compare(pw,u?.password_hash||dummy);
 if(!u||u.disabled||!valid)return null;
 const {password_hash:discard,...safeUser}=u;void discard;
 return safeUser;
}
