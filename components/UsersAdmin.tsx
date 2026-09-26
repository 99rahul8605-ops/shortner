"use client";
import { useState, type FormEvent } from 'react';

type U = { id: string; email: string; disabled: boolean; email_verified_at: string | null; admin_created: boolean };
type R = { id: string; slug: string; reason: string; details: string; created_at: string };

export default function UsersAdmin({ users, reports }: { users: U[]; reports: R[] }) {
  const [list, setList] = useState(users);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState<{email:string;password:string} | null>(null);

  async function createAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setIssued(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create account');
      setList(old => [data.user as U, ...old]);
      setIssued({ email: data.user.email, password: data.temporaryPassword });
      setEmail('');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function setSuspended(user: U) {
    if (!confirm(`${user.disabled ? 'Enable' : 'Suspend'} ${user.email}?`)) return;
    setError('');
    try {
      const res = await fetch('/api/admin/users/' + user.id, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !user.disabled })
      });
      if (!res.ok) throw new Error('Could not change account status');
      setList(old => old.map(x => x.id === user.id ? { ...x, disabled: !x.disabled } : x));
    } catch (err) { setError((err as Error).message); }
  }

  return <main className="wrap">
    <p><a href="/admin">← Owner dashboard</a></p>
    <section className="panel">
      <h1>Create a test account</h1>
      <p>Only the owner can create these accounts. Email delivery is not needed for initial testing. The email is <strong>not verified</strong> until the user verifies it later.</p>
      <form onSubmit={createAccount}>
        <label>Test user email
          <input className="input" type="email" required maxLength={254} autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} placeholder="tester@example.com" />
        </label>
        <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Create account and generate password'}</button>
      </form>
      {error && <p className="alert" role="alert">{error}</p>}
      {issued && <div className="panel" role="status" style={{marginTop:16}}>
        <h2>Copy the temporary password now</h2>
        <p>Email: <strong>{issued.email}</strong></p>
        <p>Password: <code style={{overflowWrap:'anywhere'}}>{issued.password}</code></p>
        <button className="btn gray" onClick={() => navigator.clipboard.writeText(issued.password).catch(() => setError('Copy failed; select and copy the password manually.'))}>Copy password</button>{' '}
        <button className="btn gray" onClick={() => setIssued(null)}>Hide password</button>
        <p>Only the password hash is stored. Share the password securely with the tester. Password recovery emails require Resend setup.</p>
      </div>}
    </section>
    <section className="panel">
      <h2>User accounts</h2>
      <table className="table"><thead><tr><th>Email</th><th>Email status</th><th>Access</th><th>Action</th></tr></thead>
        <tbody>{list.map(u => <tr key={u.id}>
          <td>{u.email}</td>
          <td>{u.email_verified_at ? 'Verified' : u.admin_created ? 'Admin-created (unverified)' : 'Unverified'}</td>
          <td>{u.disabled ? 'Suspended' : 'Active'}</td>
          <td><button className="btn gray" onClick={() => setSuspended(u)}>{u.disabled ? 'Enable' : 'Suspend'}</button></td>
        </tr>)}</tbody></table>
    </section>
    <section className="panel"><h2>Abuse reports</h2><table className="table"><thead><tr><th>Alias</th><th>Reason</th><th>Details</th></tr></thead><tbody>
      {reports.map(r => <tr key={r.id}><td>{r.slug}</td><td>{r.reason}</td><td>{r.details}</td></tr>)}
    </tbody></table></section>
  </main>;
}
