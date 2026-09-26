 'use client';
import {useState, type FormEvent} from 'react';
export default function LoginForm() {
  const [username,setUsername]=useState('admin');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r=await fetch('/api/admin/login',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username,password})
      });
      if (!r.ok) {
        // Display a useful error without revealing which credential was wrong.
        setError(r.status===403 ? 'Request origin rejected. Check your site URL configuration.' :
          r.status===401 ? 'Incorrect username or password.' : 'Login unavailable. Check server logs.');
        return;
      }
      window.location.href='/admin';
    } catch {setError('Connection failed');}
    finally {setBusy(false);}
  }
  return <form onSubmit={submit}>
    <label>Username<input className="input" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)}/></label>
    <label>Password (8–128 characters)<input className="input" type="password" autoComplete="current-password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    {error&&<p className="alert" role="alert">{error}</p>}
    <button className="btn" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  </form>;
}
