"use client";
import {useState,type FormEvent} from 'react';
type U={id:string;email:string;disabled:boolean;email_verified_at:string|null;admin_created:boolean};
type R={id:string;slug:string;reason:string;details:string;created_at:string};
export default function UsersAdmin({users,reports}:{users:U[];reports:R[]}){
 const [list,setList]=useState(users),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [issued,setIssued]=useState<{email:string;password:string}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function create(e:FormEvent){e.preventDefault();setBusy(true);setError('');setIssued(null);
 try{const r=await fetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,...(password?{password}:{})})});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Failed to create account');setList(prev=>[d.user,...prev]);setIssued({email:d.user.email,password:d.temporaryPassword});setEmail('');setPassword('');}
 catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function reset(u:U){const chosen=prompt(`Enter a new password for ${u.email} (6–128 characters). Leave blank to generate a secure password.`);
 if(chosen===null)return;setError('');setIssued(null);setBusy(true);
 try{const r=await fetch(`/api/admin/users/${u.id}/password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:chosen})});const d=await r.json();if(!r.ok)throw Error(d.error||'Failed to reset');setIssued({email:u.email,password:d.password});}
 catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function suspended(u:U){if(!confirm(`${u.disabled?'Enable':'Suspend'} ${u.email}?`))return;
 const r=await fetch(`/api/admin/users/${u.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({disabled:!u.disabled})});
 if(r.ok)setList(old=>old.map(x=>x.id===u.id?{...x,disabled:!x.disabled}:x));else setError('Unable to update account');}
 return <main className="wrap"><p><a href="/admin">← Owner dashboard</a></p>
 <section className="panel"><h1>Create test account</h1><p className="muted">Owner-created accounts can log in immediately, without Resend. This is <b>admin-approved testing access</b>, not proof of email ownership.</p>
 <form onSubmit={create}><label>Email address<input className="input" type="email" required maxLength={254} autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password (optional; 6–128 characters)<input className="input" type="password" minLength={6} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Leave empty to generate a secure password"/></label>
 <button className="btn" disabled={busy}>{busy?'Working…':'Create test account'}</button></form>
 {error&&<p className="alert" role="alert">{error}</p>}
 {issued&&<div className="panel" role="status"><h2>New password — shown only now</h2><p>{issued.email}</p><p><code>{issued.password}</code></p><button className="btn gray" onClick={()=>navigator.clipboard.writeText(issued.password)}>Copy password</button>{' '}<button className="btn gray" onClick={()=>setIssued(null)}>Hide</button><p className="muted">Passwords are stored as bcrypt hashes. Existing passwords cannot be displayed; reset one if needed.</p></div>}
 </section><section className="panel"><h2>Accounts</h2><div style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Email</th><th>Status</th><th>Access</th><th>Actions</th></tr></thead><tbody>
 {list.map(u=><tr key={u.id}><td>{u.email}</td><td>{u.email_verified_at?'Email verified':u.admin_created?'Admin-approved test (email unverified)':'Email unverified'}</td><td>{u.disabled?'Suspended':'Active'}</td><td>{u.admin_created&&<button className="btn gray" disabled={busy} onClick={()=>reset(u)}>Set / reset password</button>}{' '}<button className="btn gray" disabled={busy} onClick={()=>suspended(u)}>{u.disabled?'Enable':'Suspend'}</button></td></tr>)}
 </tbody></table></div></section><section className="panel"><h2>Abuse reports</h2><table className="table"><thead><tr><th>Alias</th><th>Reason</th><th>Details</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td>{r.slug}</td><td>{r.reason}</td><td>{r.details}</td></tr>)}</tbody></table></section></main>
}
