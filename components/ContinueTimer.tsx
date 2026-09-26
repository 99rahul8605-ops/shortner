"use client";
import {useEffect,useState,type ReactNode} from 'react';
export default function ContinueTimer({slug,step,startedAt,seconds,children}:{slug:string,step:number,startedAt:number,seconds:number,children?:ReactNode}){
 const [actualStart,setActualStart]=useState(startedAt);
 const [remaining,setRemaining]=useState(startedAt>0?Math.max(0,seconds-Math.floor((Date.now()-startedAt)/1000)):seconds);
 const [revealed,setRevealed]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{
   const onPopupClose=(event:Event)=>setActualStart((event as CustomEvent<{startedAt:number}>).detail.startedAt);
   window.addEventListener('bingolink:popup-closed',onPopupClose);
   return()=>window.removeEventListener('bingolink:popup-closed',onPopupClose);
 },[]);
 useEffect(()=>{if(actualStart<=0)return;
 const tick=()=>setRemaining(Math.max(0,seconds-Math.floor((Date.now()-actualStart)/1000)));
 tick();const id=window.setInterval(tick,500);return()=>window.clearInterval(id);
 },[seconds,actualStart]);
 async function next(){setLoading(true);setError('');try{const r=await fetch('/api/continue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,step})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Please try again');window.location.assign(d.next);}catch(e){setError((e as Error).message);setLoading(false)}}
 return <><section className="timer-card" id="continue-timer"><h2>{step===4?'Your destination is almost ready':'Your next step is almost ready'}</h2><p>Please wait for the countdown. Advertisements are optional.</p><div className="timer big" aria-live="polite">{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</div><button className="continue-main" disabled={actualStart<=0||remaining>0} onClick={()=>{setRevealed(true);document.getElementById('final-continue')?.scrollIntoView({behavior:'smooth',block:'center'});}}>{actualStart<=0?'Close the popup first':remaining>0?'Please wait…':revealed?'Scroll down to continue':'Continue'}</button>{revealed&&<p className="scroll-hint">↓ SCROLL DOWN AND CLICK CONTINUE ↓</p>}</section>{children}<section className="bottom-continue" id="final-continue"><p>{step===4?'Your original destination is ready.':'Ready for the next article?'}</p><button className="continue-main" disabled={actualStart<=0||remaining>0||!revealed||loading} onClick={next}>{loading?'Opening…':step===4?'GET ORIGINAL LINK':'CONTINUE TO NEXT STEP'}</button>{!revealed&&<small>Use the Continue button above after the countdown.</small>}{error&&<p className="alert" role="alert">{error}</p>}</section></>;
}
