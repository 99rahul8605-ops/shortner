"use client";
import {useEffect,useState,type ReactNode} from 'react';

export default function ContinueTimer({slug,step,routeToken,startedAt,seconds,children}:{slug:string,step:number,routeToken:string,startedAt:number,seconds:number,children?:ReactNode}) {
  const [actualStart,setActualStart]=useState(startedAt);
  const [remaining,setRemaining]=useState(seconds);
  const [revealed,setRevealed]=useState(false);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const onPopupClose=(event:Event)=>{
      const value=(event as CustomEvent<{startedAt:number}>).detail?.startedAt;
      if(typeof value==='number' && value>0) setActualStart(value);
    };
    window.addEventListener('bingolink:popup-closed',onPopupClose);
    return()=>window.removeEventListener('bingolink:popup-closed',onPopupClose);
  },[]);
  useEffect(()=>{
    if(actualStart<=0) { setRemaining(seconds); return; }
    const tick=()=>setRemaining(Math.max(0,seconds-Math.floor((Date.now()-actualStart)/1000)));
    tick();
    const id=window.setInterval(tick,500);
    return()=>window.clearInterval(id);
  },[seconds,actualStart]);

  const ready=actualStart>0 && remaining===0;
  async function next(){
    if(!ready || !revealed || loading) return;
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/continue',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,step,vt:routeToken})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Please try again');
      window.location.assign(d.next);
    }catch(e){setError((e as Error).message);setLoading(false)}
  }
  return <>
    <section className="timer-card timer-card-compact" id="continue-timer">
      <div className="timer-compact-label">{step===4?'Your link is almost ready':'Next step is almost ready'}</div>
      <div className="timer-compact-clock" role="timer" aria-live="off">
        {String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}
      </div>
      <p className="timer-compact-note">{actualStart<=0?'Close the popup to start your timer.':ready?'Timer complete. You can continue.':'Please wait for the countdown.'}</p>
      {ready && <button className="continue-main" type="button" onClick={()=>{
        setRevealed(true);
        window.setTimeout(()=>document.getElementById('final-continue')?.scrollIntoView({behavior:'smooth',block:'center'}),0);
      }}>{revealed?'Go to bottom Continue':'Continue'}</button>}
    </section>
    {children}
    <section className="bottom-continue" id="final-continue">
      <p>{step===4?'Your original destination is ready.':'Ready for the next article?'}</p>
      {ready && revealed ? <button className="continue-main" type="button" disabled={loading} onClick={next}>{loading?'Opening…':step===4?'GET ORIGINAL LINK':'CONTINUE TO NEXT STEP'}</button>
      : <small>{!ready?'The button will appear when the countdown ends.':'Tap Continue above to unlock this button.'}</small>}
      {error&&<p className="alert" role="alert">{error}</p>}
    </section>
  </>;
}
