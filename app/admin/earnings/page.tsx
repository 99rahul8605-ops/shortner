import {redirect} from 'next/navigation';import {isAdmin} from '@/lib/auth';import AdminEarnings from '@/components/AdminEarnings';
export const runtime='nodejs';export const dynamic='force-dynamic';
export default async function Page(){if(!await isAdmin())redirect('/admin/login');return <main className="wrap"><header className="header"><a className="brand" href="/admin">BingoLink Admin</a><span>Revenue &amp; payouts</span></header><AdminEarnings/></main>}
