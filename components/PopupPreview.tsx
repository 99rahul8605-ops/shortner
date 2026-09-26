"use client";
import {useState} from 'react';
export type PreviewLabels={title:string;intro:string;heading:string;description:string;orange:string;blue:string;middleNote:string};
export default function PopupPreview({labels}:{labels:PreviewLabels}){
 const [open,setOpen]=useState(false);
 return <><button type="button" className="btn gray" onClick={()=>setOpen(true)}>Preview popup (unsaved changes)</button>
 {open&&<div className="visitor-overlay admin-popup-preview" role="dialog" aria-modal="true" aria-label="Popup preview">
 <div className="visitor-modal"><button type="button" className="modal-close" onClick={()=>setOpen(false)} aria-label="Close preview"><span>×</span></button>
 <div className="modal-instructions"><strong>{labels.title}</strong><p>{labels.intro}</p></div>
 <div className="modal-body"><p className="popup-heading">{labels.heading}</p><p className="popup-subheading">{labels.description}</p>
 <div className="sponsor-button orange">{labels.orange} ↗</div><p className="popup-middle-note">{labels.middleNote}</p><div className="sponsor-button blue">{labels.blue} ↗</div>
 <p className="popup-optional">Preview only. Buttons do not open advertising.</p><button className="btn gray" type="button" onClick={()=>setOpen(false)}>Close preview</button></div>
 </div></div>}</>;
}
