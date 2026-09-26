import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/users';
import { query } from '@/lib/db';
import UserDashboard from '@/components/UserDashboard';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect('/login');
  const [l, k, d, totals] = await Promise.all([
    query(`SELECT l.id::text,l.slug,l.destination,l.title,l.enabled,l.created_at::text,COUNT(v.id)::int AS clicks
      FROM links l LEFT JOIN visits v ON v.link_id=l.id
      WHERE l.owner_id=$1 GROUP BY l.id ORDER BY l.created_at DESC LIMIT 100`, [u.id]),
    query('SELECT id::text,name,key_prefix,created_at,last_used_at,revoked_at FROM api_keys WHERE user_id=$1 ORDER BY id DESC', [u.id]),
    query<{day: string; visits: number}>(`SELECT to_char(days.day::date, 'YYYY-MM-DD') AS day, COUNT(v.id)::int AS visits
      FROM generate_series((now() AT TIME ZONE 'UTC')::date - 6,
                           (now() AT TIME ZONE 'UTC')::date, interval '1 day') AS days(day)
      LEFT JOIN visits v ON
        v.visited_at >= (days.day::date::timestamp AT TIME ZONE 'UTC')
        AND v.visited_at < ((days.day::date + 1)::timestamp AT TIME ZONE 'UTC')
        AND v.link_id IN (SELECT id FROM links WHERE owner_id=$1)
      GROUP BY days.day ORDER BY days.day`, [u.id]),
    query<{links: number; visits: number; active: number}>(`SELECT COUNT(DISTINCT l.id)::int AS links,
      COUNT(v.id)::int AS visits,
      COUNT(DISTINCT l.id) FILTER (WHERE l.enabled)::int AS active
      FROM links l LEFT JOIN visits v ON v.link_id=l.id WHERE l.owner_id=$1`, [u.id]),
  ]);
  return <UserDashboard email={u.email} initialLinks={l.rows as never}
    initialKeys={k.rows as never} dailyVisits={d.rows}
    totals={totals.rows[0] || {links: 0, visits: 0, active: 0}} />;
}
