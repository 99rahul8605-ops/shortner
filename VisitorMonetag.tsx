"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

const CHECK_INTERVAL_MS = 2000;
const BAIT_SETTLE_MS = 180;

function baitLooksBlocked(el: HTMLDivElement) {
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    style.opacity === "0" ||
    rect.width === 0 ||
    rect.height === 0 ||
    el.offsetParent === null
  );
}

export default function VisitorMonetag({
  enabled,
}: {
  enabled: boolean;
}) {
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(enabled);
  const scriptFailedRef = useRef(false);
  const runningRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (!enabled || runningRef.current) return;
    runningRef.current = true;

    const bait = document.createElement("div");
    bait.className =
      "adsbox ad ads ad-banner advertisement ad-placement pub_300x250 text-ad";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText =
      "position:absolute!important;left:-10000px!important;top:-10000px!important;width:10px!important;height:10px!important;pointer-events:none!important;";

    document.body.appendChild(bait);

    await new Promise((resolve) => window.setTimeout(resolve, BAIT_SETTLE_MS));

    const baitBlocked = baitLooksBlocked(bait);
    bait.remove();

    setBlocked(scriptFailedRef.current || baitBlocked);
    setChecking(false);
    runningRef.current = false;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setBlocked(false);
      setChecking(false);
      return;
    }

    // Every article step mounts this component and immediately checks again.
    setChecking(true);
    void runCheck();

    // Keep checking while the article is open. If the visitor enables an
    // ad blocker after Step 1, the current/next step can still catch it.
    const interval = window.setInterval(() => {
      void runCheck();
    }, CHECK_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void runCheck();
    };
    window.addEventListener("focus", runCheck);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", runCheck);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, runCheck]);

  useEffect(() => {
    if (!blocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [blocked]);

  if (!enabled) return null;

  const markScriptFailed = () => {
    scriptFailedRef.current = true;
    setBlocked(true);
    setChecking(false);
  };

  const retry = () => {
    scriptFailedRef.current = false;
    setBlocked(false);
    setChecking(true);
    void runCheck();
  };

  return (
    <>
      <Script
        id="monetag-multitag"
        src="https://quge5.com/88/tag.min.js"
        data-zone="286925"
        data-cfasync="false"
        strategy="afterInteractive"
        onError={markScriptFailed}
      />

      <Script
        id="monetag-inpage-push"
        src="https://nap5k.com/tag.min.js"
        data-zone="11898794"
        strategy="afterInteractive"
        onError={markScriptFailed}
      />

      <Script id="hilltop-extra-visitor-ad" strategy="afterInteractive">
        {`
(function(sxg){
var d = document,
    s = d.createElement('script'),
    l = d.currentScript || d.scripts[d.scripts.length - 1];
s.settings = sxg || {};
s.src = "//unfoldedtrade.com/blXrVss.drGslL0lYcWzcW/MeEm/9MucZ/U/lzktPETJc-1rNlDHQHyiN/zHcotONUzBU-0VNhDpIw4bMHQf";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
        `}
      </Script>

      {(blocked || checking) && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="adblock-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(8, 15, 30, 0.96)",
          }}
        >
          <div
            style={{
              width: "min(460px, 100%)",
              borderRadius: 18,
              background: "#ffffff",
              color: "#111827",
              padding: 24,
              textAlign: "center",
              boxShadow: "0 24px 70px rgba(0,0,0,.35)",
            }}
          >
            {checking && !blocked ? (
              <>
                <h2 id="adblock-title" style={{ margin: "0 0 10px" }}>
                  Checking browser…
                </h2>
                <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.6 }}>
                  Please wait while we verify that the article can load correctly.
                </p>
              </>
            ) : (
              <>
                <h2 id="adblock-title" style={{ margin: "0 0 10px" }}>
                  Ad blocker detected
                </h2>
                <p style={{ margin: "0 0 18px", color: "#4b5563", lineHeight: 1.6 }}>
                  Please disable your ad blocker or browser shield for BingoLink, then tap Retry to continue.
                </p>
                <button
                  type="button"
                  onClick={retry}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    padding: "11px 20px",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: "#2563eb",
                    color: "#ffffff",
                  }}
                >
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
