import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import {query} from '@/lib/db';
import {getSettings, type LinkRow} from '@/lib/data';
import AdminPanel from '@/components/AdminPanel';
export const runtime='nodejs';export const dynamic='force-dynamic';
export default async function Admin(){if(!(await isAdmin()))redirect('/admin/login');
const [lr,s,tot]=await Promise.all([query<LinkRow>(`SELECT l.id,l.slug,l.destination,l.title,l.enabled,l.created_at::text,COUNT(v.id)::int AS clicks FROM links l LEFT JOIN visits v ON v.link_id=l.id GROUP BY l.id ORDER BY l.created_at DESC LIMIT 100`),getSettings(),query<{total:string}>('SELECT COUNT(*)::text AS total FROM visits')]);
return <main className="wrap"><header className="header"><div className="brand">🔗 BingoLink Admin</div><a href="/" className="btn gray">View site</a></header><div className="grid"><div className="stat"><small>Total links</small><h2>{lr.rowCount}</h2></div><div className="stat"><small>Recorded visits (not ad revenue)</small><h2>{tot.rows[0]?.total||'0'}</h2></div><div className="stat"><small>Ad tag</small><h2>{s.ads_enabled==='true'?'Enabled':'Disabled'}</h2></div></div><AdminPanel initialLinks={lr.rows} initialSettings={s}/></main>}
