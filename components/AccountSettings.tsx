'use client';
import {useState,type FormEvent} from 'react';
import AccountAreaShell from '@/components/AccountAreaShell';
export default function AccountSettings({initialUsername,email,verified}:{initialUsername:string|null;email:string;verified:boolean}){
 const [username,setUsername]=useState(initialUsername||'');const [saved,setSaved]=useState(initialUsername||'');
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);void verified;
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
 const r=await fetch('/api/account/username',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username})});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save username');setSaved(d.username);setMessage('Username saved. You can use it to sign in next time.');
 }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <AccountAreaShell title="Account settings" description="Manage your username and recovery email."><section className="pro-card site-account-card"><div className="site-account-card-head"><div className="site-page-icon">⚙</div><div><h2>Your profile</h2><p>Keep your account details up to date.</p></div></div>
 <p><strong>Username:</strong> {saved||'Not set yet'}</p><p><strong>Recovery email:</strong> {email}</p>
 {!saved&&<form onSubmit={submit}><label>Choose your username<input className="input" value={username} required minLength={3} maxLength={30} pattern="[A-Za-z][A-Za-z0-9_]{2,29}" onChange={e=>setUsername(e.target.value)}/></label><button className="btn" disabled={busy}>Save username</button></form>}
 {message&&<p className="alert" role="status">{message}</p>}
 <p><a href="/forgot-password">Reset password using recovery email</a></p>
 </section></AccountAreaShell>;
}
