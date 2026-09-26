import AdminAreaShell from '@/components/AdminAreaShell';
import {redirect} from 'next/navigation';import {isAdmin} from '@/lib/auth';import AdminEarnings from '@/components/AdminEarnings';
export const runtime='nodejs';export const dynamic='force-dynamic';
export default async function Page(){if(!await isAdmin())redirect('/admin/login');return <AdminAreaShell title="Revenue & payouts" description="Review verified earnings and manage user withdrawals." section="earnings"><div className="admin-subpage"><AdminEarnings/></div></AdminAreaShell>}
