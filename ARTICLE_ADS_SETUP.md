# BingoLink article ad layout fix

This version is based on BingoLink-Revenue50-Complete.zip and retains its earnings/admin/database features.

## What changed
- Visitor article steps 1-3 have the first 300x250 HilltopAds ad ABOVE the compact timer.
- A SECOND independently configured 300x250 banner goes immediately BELOW the timer when configured.
- Removed the duplicate third/middle copies of HilltopAds zone 7463121, which could leave blank ad slots.
- Both Continue buttons appear ONLY after the server-synchronized timer ends. The lower button additionally requires clicking the first Continue. The final Get Link behaves the same way.
- Admin and homepage remain ad-free. Monetag remains unchanged.

## IMPORTANT: a second banner requires its own zone
HilltopAds zone 7463121 is used only once per page. Do NOT repeat its tag and expect multiple ads. To populate the bottom slot, create a second 300x250 banner zone in HilltopAds, select Get Code, and copy only the external **s.src** URL (e.g., https://YOUR-PUBLISHER-DOMAIN/...; DO NOT copy this example). Add that URL to the Vercel Production environment variable `NEXT_PUBLIC_HILLTOP_BANNER_2_SRC` and redeploy. The new tag must use the same publisher bootstrap structure as your first provided HilltopAds tag; if it differs, send the full second tag to adapt integration. Until configured, no empty bottom ad box appears. Ad delivery remains at the network's discretion.

The original popunder with anti-adblock code is NOT enabled.

## Deploy
Extract the ZIP contents into your GitHub repo root and commit. Back up current files. Run your build and test an actual short link. Do not upload .env files or API keys.
