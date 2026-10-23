"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

export default function VisitorMonetag({
  enabled,
}: {
  enabled: boolean;
}) {
  const [adsBlocked, setAdsBlocked] = useState(false);
  const scriptFailures = useRef(0);

  const runAdBlockCheck = useCallback(() => {
    if (!enabled) return;

    const bait = document.createElement("div");
    bait.className = "adsbox ad-banner ad-unit text-ad pub_300x250";
    bait.setAttribute("aria-hidden", "true");
    bait.style.cssText =
      "position:absolute!important;left:-10000px!important;top:-10000px!important;width:1px!important;height:1px!important;pointer-events:none!important;";
    document.body.appendChild(bait);

    window.setTimeout(() => {
      const style = window.getComputedStyle(bait);
      const blocked =
        !document.body.contains(bait) ||
        style.display === "none" ||
        style.visibility === "hidden" ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0;

      bait.remove();
      if (blocked) setAdsBlocked(true);
    }, 650);
  }, [enabled]);

  useEffect(() => {
    runAdBlockCheck();
  }, [runAdBlockCheck]);

  if (!enabled) return null;

  const markScriptFailure = () => {
    scriptFailures.current += 1;
    // One ad provider request may occasionally fail. Two failures together are
    // a much stronger signal that an ad/privacy blocker is stopping requests.
    if (scriptFailures.current >= 2) setAdsBlocked(true);
  };

  return (
    <>
      <Script
        id="monetag-multitag"
        src="https://quge5.com/88/tag.min.js"
        data-zone="286925"
        data-cfasync="false"
        strategy="afterInteractive"
        onError={markScriptFailure}
      />

      <Script
        id="monetag-inpage-push"
        src="https://nap5k.com/tag.min.js"
        data-zone="11898794"
        strategy="afterInteractive"
        onError={markScriptFailure}
      />

      {adsBlocked && (
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
            background: "#f4f7fb",
            color: "#18243a",
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          <div
            style={{
              width: "min(520px, 100%)",
              background: "#fff",
              border: "1px solid #dce5f0",
              borderRadius: 18,
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 18px 55px rgba(25, 45, 75, .12)",
            }}
          >
            <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 14 }}>🛡️</div>
            <h1
              id="adblock-title"
              style={{ margin: "0 0 12px", fontSize: 27, color: "#162b49" }}
            >
              Ad blocker detected
            </h1>
            <p style={{ margin: "0 auto 10px", maxWidth: 430, lineHeight: 1.65, color: "#526174" }}>
              Ads are required on this article page. Please disable your ad blocker, browser shield,
              or DNS ad filtering for BingoLink, then reload this page.
            </p>
            <p style={{ margin: "0 auto 22px", maxWidth: 430, lineHeight: 1.55, fontSize: 14, color: "#718096" }}>
              If you already disabled it, allow this site in your blocker and tap Retry.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: 0,
                borderRadius: 11,
                background: "#4775e9",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                padding: "13px 28px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}
