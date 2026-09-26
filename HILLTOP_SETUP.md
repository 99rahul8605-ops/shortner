# BingoLink visitor-banner integration

Source: uploaded shortner-main.zip. All original project files are retained.

**HilltopAds zone 7463121** (300x250 banner) is mounted in the three
ADVERTISEMENT placements on visitor article steps 1-3. It is loaded by
`components/HilltopBanner.tsx`, which uses the exact publisher bootstrap in
`hta-code-7463121.txt`. The article placements are in
`app/go/[slug]/[step]/page.tsx` and only mount the external banner script
when the existing Admin `ads_enabled` setting is enabled.

**NOT included**: HilltopAds popunder/anti-adblock zone 7463153; its supplied
script is separate and adding it alongside existing Monetag ads could cause
conflicting popup behavior.

Existing Monetag MultiTag and In-Page Push have not been changed. Banner fill
and whether one zone serves all three placements are controlled by HilltopAds.
If one page only receives one creative, generate distinct 300x250 zones for
additional placements and provide those tags before updating the component.

To deploy: back up your repository, extract this ZIP's `shortner-main/`
contents into the repository root (do not create an extra directory), commit,
and let Vercel deploy. Do not upload local `.env*` files or passwords.
Visit an actual short link (not the dashboard), enable ads in Admin, and
check the visitor article pages without an ad blocker. If ads are missing,
check browser DevTools > Network for the publisher's `unfoldedtrade.com` URL.
