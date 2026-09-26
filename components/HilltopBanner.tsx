"use client";

import { useEffect, useRef } from "react";

/** HilltopAds zone 7463121: inline 300x250 ad for visitor articles only.
 *  The publisher bootstrap anchors the ad at document.currentScript's parent.
 */
export default function HilltopBanner({ enabled }: { enabled: boolean }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = container.current;
    if (!enabled || !host) return;

    // Append the supplied bootstrap as an actual script element: HTML script
    // text inserted through React markup does not execute on hydration.
    const script = document.createElement("script");
    script.text = HILLTOP_BANNER_BOOTSTRAP;
    host.appendChild(script);

    return () => {
      host.replaceChildren();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="hilltop-banner" aria-label="Advertisement">
      <div ref={container} className="hilltop-banner-host" />
    </div>
  );
}

// Original HilltopAds publisher tag for zone 7463121, unmodified.
const HILLTOP_BANNER_BOOTSTRAP = '(function(ktv){\nvar d = document,\n    s = d.createElement(\'script\'),\n    l = d.currentScript || d.scripts[d.scripts.length - 1];\ns.settings = ktv || {};\ns.src = "\\/\\/unfoldedtrade.com\\/b.XKVns-duGwlB0\\/Y\\/Wncn\\/De\\/mz9juYZFUUlzktPcTGcA0ONbjIMAxoMrjSEdt_N\\/zUQb2-MXzcEmymNxQS";\ns.async = true;\ns.referrerPolicy = \'no-referrer-when-downgrade\';\nl.parentNode.insertBefore(s, l);\n})({})';
