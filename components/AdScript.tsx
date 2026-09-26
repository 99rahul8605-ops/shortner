'use client';
import {useEffect} from 'react';
export default function AdScript({urls}:{urls:string[]}){
  useEffect(()=>{
    // Only owner-supplied HTTPS URLs; Monetag's official instructions decide actual formats.
    const scripts:HTMLScriptElement[]=[];
    for(const src of [...new Set(urls)]){
      if(!src)continue;
      try{if(new URL(src).protocol!=='https:')continue;}catch{continue;}
      const el=document.createElement('script');el.src=src;el.async=true;el.dataset.bingolinkAd='true';document.head.appendChild(el);scripts.push(el);
    }
    return()=>{for(const el of scripts)el.remove()};
  },[urls.join('|')]);
  return null;
}
