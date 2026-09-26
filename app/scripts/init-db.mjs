import pg from 'pg';
import fs from 'node:fs';
const conn=process.env.DATABASE_URL;
if(!conn) { console.error('Set DATABASE_URL first');process.exit(1); }
const u=new URL(conn);u.searchParams.delete('sslmode');
const ca=process.env.PG_CA_CERT_BASE64?Buffer.from(process.env.PG_CA_CERT_BASE64,'base64').toString():undefined;
const c=new pg.Client({connectionString:u.toString(),ssl:{rejectUnauthorized:true,...(ca?{ca}:{})}});
try { await c.connect(); await c.query(fs.readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));console.log('Database tables initialized'); } finally { await c.end(); }
