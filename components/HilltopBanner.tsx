"use client";

import { useEffect, useRef } from "react";

type BannerSlot = "top" | "below-timer" | "bottom-one" | "bottom-two";

// Each banner placement uses its own HilltopAds tag.
const TAGS: Record<BannerSlot, string> = {
  "top": "https://unfoldedtrade.com/b.XKVns-duGwlB0/Y/Wncn/De/mz9juYZFUUlzktPcTGcA0ONbjIMAxoMrjSEdt_N/zUQb2-MXzcEmymNxQS",
  "below-timer": "https://unfoldedtrade.com/b/X.V/sGdWGmlw0AYfWccJ/xePm/9RuqZTUil-ktPGTjch0ANkjNM/1ENdzIMstsNPz/Q/2sM/zuU/3RN-wr",
  "bottom-one": "https://unfoldedtrade.com/bTXeV/s.dQG/lJ0/Y/Wack/SexmF9iu/Z/U-lskfP/TKcG0TN/jSMx2oMhDeUHtYNwz/Qi2/M/zWYBwMO/QM",
  "bottom-two": "https://unfoldedtrade.com/b_X/VGs.dgGkl/0TYDW/cn/reFmN9/uQZmUFlMkcPKTbc/0SNrjgMM3ZMrzSMNtHNMzNQo2QMqzkc/zONvwX",
};

export default function HilltopBanner({
  enabled,
  slot,
}: {
  enabled: boolean;
  slot: BannerSlot;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;

    // Each tag must run inside its own banner element so currentScript
    // resolves to the intended slot, not to the page-wide document head.
    const inline = document.createElement("script");
    inline.text = `((url) => {
      const s = document.createElement("script");
      const anchor = document.currentScript;
      s.settings = {};
      s.src = url;
      s.async = true;
      s.referrerPolicy = "no-referrer-when-downgrade";
      anchor.parentNode.insertBefore(s, anchor);
    })(${JSON.stringify(TAGS[slot])});`;
    host.appendChild(inline);

    return () => { host.replaceChildren(); };
  }, [enabled, slot]);

  if (!enabled) return null;
  return (
    <div className="hilltop-banner" aria-label="Advertisement">
      <div ref={hostRef} className="hilltop-banner-host" />
    </div>
  );
}
