"use client";
import {useEffect,useState} from 'react';
export default function VisitorPopup({directUrl}:{directUrl:string|null}){
 const [visible,setVisible]=useState(true),[remaining,setRemaining]=useState(15);
 useEffect(()=>{const id=window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>window.clearInterval(id)},[]);
 if(!visible)return null;
 return <div className="visitor-overlay" role="dialog" aria-modal="true" aria-label="Link instructions"><div className="visitor-modal"><button type="button" aria-label={remaining?`Close available in ${remaining} seconds`:'Close popup'} disabled={remaining>0} className="modal-close" onClick={()=>setVisible(false)}>×</button><div className="modal-instructions"><strong>YOUR LINK IS ALMOST READY</strong><p>Explore sponsored content while you wait. Ad interaction is optional.</p></div><div className="modal-body"><div className="sponsor-flag">SPONSORED CONTENT</div>{directUrl?<><a className="sponsor-button orange" href={directUrl} target="_blank" rel="noopener noreferrer sponsored">VIEW SPONSORED AD ↗</a><p>Interested? You can explore the advertisement in a new tab.</p><a className="sponsor-button blue" href={directUrl} target="_blank" rel="noopener noreferrer sponsored">EXPLORE ADVERTISEMENT ↗</a></>:<p>No sponsored links are configured. Continue reading below.</p>}<p className="close-countdown">{remaining>0?`Close available in ${remaining} seconds`:'You may now close this popup and continue reading.'}</p></div></div></div>;
}
