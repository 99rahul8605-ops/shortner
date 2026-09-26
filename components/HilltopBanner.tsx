"use client";

import { useEffect, useRef } from "react";

/** HilltopAds zone 7463121: inline 300x250 ad for visitor articles only.
 *  The publisher bootstrap anchors the ad at document.currentScript's parent.
 */
export default function HilltopBanner({ enabled, source = "primary" }: { enabled: boolean; source?: "primary" | "secondary" }) {
  const container = useRef<HTMLDivElement>(null);
  // Second placement needs its OWN HilltopAds 300x250 zone. Set this value
  // to the external s.src URL from that zone's Get Code tag.
  const secondarySrc = process.env.NEXT_PUBLIC_HILLTOP_BANNER_2_SRC;
  const validSecondary = (() => {
    if (!secondarySrc) return null;
    try { const url = new URL(secondarySrc); return url.protocol === "https:" && url.hostname !== "" ? url.href : null; }
    catch { return null; }
  })();
  const scriptSrc = source === "secondary" ? validSecondary : null;
  const active = enabled && (source === "primary" || !!scriptSrc);

  useEffect(() => {
    const host = container.current;
    if (!active || !host) return;

    // Append the supplied bootstrap as an actual script element: HTML script
    // text inserted through React markup does not execute on hydration.
    const script = document.createElement("script");
    script.text = source === "primary"
      ? HILLTOP_BANNER_BOOTSTRAP
      : `((url) => { var d=document,s=d.createElement('script'),l=d.currentScript; s.settings={}; s.src=url; s.async=true; s.referrerPolicy='no-referrer-when-downgrade'; l.parentNode.insertBefore(s,l); })(${JSON.stringify(scriptSrc)});`;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, [active, source, scriptSrc]);

  if (!active) return null;

  return (
    <div className="hilltop-banner" aria-label="Advertisement">
      <div ref={container} className="hilltop-banner-host" />
    </div>
  );
}

// Original HilltopAds publisher tag for zone 7463121, unmodified.
const HILLTOP_BANNER_BOOTSTRAP = '(function(ktv){\nvar d = document,\n    s = d.createElement(\'script\'),\n    l = d.currentScript || d.scripts[d.scripts.length - 1];\ns.settings = ktv || {};\ns.src = "\\/\\/unfoldedtrade.com\\/b.XKVns-duGwlB0\\/Y\\/Wncn\\/De\\/mz9juYZFUUlzktPcTGcA0ONbjIMAxoMrjSEdt_N\\/zUQb2-MXzcEmymNxQS";\ns.async = true;\ns.referrerPolicy = \'no-referrer-when-downgrade\';\nl.parentNode.insertBefore(s, l);\n})({})';
