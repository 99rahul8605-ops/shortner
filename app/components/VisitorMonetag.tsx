"use client";
import Script from "next/script";
// Render ONLY on /go visitor pages. Avoid placing this script in the global layout.
export default function VisitorMonetag({enabled}:{enabled:boolean}) {
 if(!enabled) return null;
 return <Script id="monetag-visitor-only" src="https://quge5.com/88/tag.min.js" data-zone="286925" data-cfasync="false" strategy="afterInteractive" />;
}
