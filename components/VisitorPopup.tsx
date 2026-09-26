"use client";

import { useEffect, useState } from "react";

/** This dialog is mounted ONLY by the public /go/[slug]/[step] page. */
export type PopupLabels = {
  title: string; intro: string; heading: string; description: string;
  orange: string; blue: string; middleNote: string;
};
export default function VisitorPopup({ directUrl, labels, slug, step, routeToken, required }: { directUrl: string | null; labels: PopupLabels; slug:string; step:number; routeToken:string; required:boolean }) {
  const [isOpen, setIsOpen] = useState(required);
  const [closing,setClosing]=useState(false);
  const [closeError,setCloseError]=useState('');
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function closePopup(){
    if(secondsLeft>0||closing)return;
    setClosing(true);setCloseError('');
    try {
      const result=await fetch('/api/popup/close',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,step,vt:routeToken})});
      const data=await result.json();if(!result.ok)throw new Error(data.error||'Try again');
      window.dispatchEvent(new CustomEvent('bingolink:popup-closed',{detail:{startedAt:data.startedAt}}));
      setIsOpen(false);
    }catch(e){setCloseError((e as Error).message);}finally{setClosing(false)}
  }
  if (!isOpen) return null;

  return (
    <div className="visitor-overlay" role="dialog" aria-modal="true" aria-labelledby="popup-heading">
      <div className="visitor-modal">
        <button
          type="button"
          className="modal-close"
          disabled={secondsLeft > 0}
          onClick={closePopup}
          aria-label={secondsLeft > 0 ? "Close locked briefly" : "Close popup"}
          title={secondsLeft > 0 ? "Close unlocks shortly" : "Close"}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="modal-instructions" id="popup-heading">
          <strong>{labels.title}</strong>
          <p>{labels.intro}</p>
        </div>

        <div className="modal-body">
          <p className="popup-heading">{labels.heading}</p>
          <p className="popup-subheading">{labels.description}</p>
          {directUrl ? (
            <>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="sponsor-button orange"
                aria-label="Open sponsored advertisement in a new tab"
              >
                {labels.orange} <span aria-hidden="true">↗</span>
              </a>
              <p className="popup-middle-note">{labels.middleNote}</p>
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="sponsor-button blue"
                aria-label="Explore sponsored advertisement in a new tab"
              >
                {labels.blue} <span aria-hidden="true">↗</span>
              </a>
            </>
          ) : (
            <div className="popup-no-ad">No sponsored links are configured yet.</div>
          )}
          {secondsLeft===0&&<p className="close-countdown">You can now close this popup to continue reading.</p>}
          {closing&&<p role="status">Opening article…</p>}
          {closeError&&<p role="alert">{closeError}</p>}
          <p className="popup-optional">You do not have to click an advertisement to access your link.</p>
        </div>
      </div>
    </div>
  );
}
