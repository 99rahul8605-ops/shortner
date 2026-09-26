
"use client";

import Script from "next/script";

export default function VisitorMonetag({
  enabled,
}: {
  enabled: boolean;
}) {
  if (!enabled) return null;

  return (
    <>
      {/* Existing Monetag MultiTag */}
      <Script
        id="monetag-multitag"
        src="https://quge5.com/88/tag.min.js"
        data-zone="286925"
        data-cfasync="false"
        strategy="afterInteractive"
      />

      {/* New Monetag In-Page Push */}
      <Script
        id="monetag-inpage-push"
        src="https://nap5k.com/tag.min.js"
        data-zone="11898794"
        strategy="afterInteractive"
      />
    </>
  );
}
