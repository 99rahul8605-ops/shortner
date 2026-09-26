import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/users';
import AccountSettings from '@/components/AccountSettings';
export const runtime='nodejs';export const dynamic='force-dynamic';
export default async function Page(){const u=await currentUser();if(!u)redirect('/login');return <AccountSettings initialUsername={u.username} email={u.email} verified={!!u.email_verified_at}/>}
