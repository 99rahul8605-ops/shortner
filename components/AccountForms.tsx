'use client';
import {useState,type FormEvent} from 'react';
import PublicShell from '@/components/PublicShell';
type Mode='register'|'login'|'forgot'|'reset'|'verify';
export default function AccountForms({mode,token}:{mode:Mode;token?:string}){
 const [username,setUsername]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [msg,setMsg]=useState('');
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setMsg('');
  try{
   if((mode==='register'||mode==='reset')&&password!==confirm)throw Error('Passwords do not match');
   const path=mode==='verify'?'verify':mode==='reset'?'reset':mode;
   const body=mode==='verify'?{token}:mode==='reset'?{token,password}:mode==='forgot'?{email}:
    mode==='register'?{username:username.trim().toLowerCase(),email,password}:{username,password};
   const r=await fetch('/api/auth/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed');
   if(mode==='login'){location.href='/dashboard';return;}
   setMsg(d.message||'Success. You can sign in now.');
  }catch(e){setMsg((e as Error).message)}finally{setBusy(false)}
 }
 return <PublicShell><div className="site-auth-layout"><aside className="site-auth-side"><span className="site-overline">WELCOME TO BINGOLINK</span><h2>{mode==='register'?'Make more of every link.':mode==='login'?'Welcome back to your workspace.': 'Your account, securely recovered.'}</h2><p>One place for links, traffic insights and all the tools you need to grow.</p><div className="site-auth-benefits"><span>✓ &nbsp; Secure link management</span><span>✓ &nbsp; Easy-to-read analytics</span><span>✓ &nbsp; Your own developer API</span></div><div className="site-auth-decor"><div>↗</div><span>BingoLink Creator Studio</span></div></aside><section className="site-auth-card"><div className="site-auth-card-head"><span className="site-overline">{mode==='register'?'CREATE ACCOUNT':mode==='login'?'ACCOUNT ACCESS':mode==='verify'?'EMAIL VERIFICATION':'ACCOUNT RECOVERY'}</span>
 <h1>{mode==='register'?'Create your account':mode==='login'?'Sign in':mode==='forgot'?'Recover account':mode==='reset'?'Choose a new password':'Verify recovery email'}</h1>
 {mode==='register'&&<p className="muted">Choose your own username and password. Email is used for secure account recovery, not required to sign in.</p>}
 {mode==='forgot'&&<p className="muted">We will email a one-time password reset link to your verified recovery email. Passwords cannot be emailed or viewed by admins.</p>}
 </div><form onSubmit={submit}>
 {mode==='register'&&<label>Username<input className="input" required minLength={3} maxLength={30} pattern="[A-Za-z][A-Za-z0-9_]{2,29}" title="Start with a letter; 3–30 letters, numbers, underscores" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username"/></label>}
 {mode==='login'&&<label>Username (or legacy email)<input className="input" required maxLength={254} autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="your_username"/></label>}
 {(mode==='register'||mode==='forgot')&&<label>{mode==='register'?'Recovery email':'Verified recovery email'}<input className="input" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
 {['register','login','reset'].includes(mode)&&<label>{mode==='login'?'Password':'Password (8–128 characters)'}<input className="input" required minLength={mode==='login'?1:8} maxLength={128} type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 {(mode==='register'||mode==='reset')&&<label>Confirm password<input className="input" required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
 {msg&&<p className="alert" role="status">{msg}</p>}
 <button className="btn" disabled={busy||(['verify','reset'].includes(mode)&&!token)}>{busy?'Please wait...':mode==='register'?'Create account':mode==='login'?'Sign in':mode==='forgot'?'Send reset link':mode==='reset'?'Change password':'Verify email'}</button>
 </form><p className="site-auth-links"><a href="/login">Sign in</a> · <a href="/register">Create account</a> · <a href="/forgot-password">Forgot password</a> · <a href="/resend-verification">Verify recovery email</a></p>
 </section></div></PublicShell>;
}
