# BingoLink earnings — installation and safety

This version uses a **50/50 split of verified, attributable HilltopAds revenue**, never estimated visits. Monetag revenue is not included in user earnings. User dashboard intentionally shows only the user's share and CPM, no ad-network names. Admin has a separate revenue and payout page.

## Install
1. Deploy this project to your existing Vercel project, preserving current server-side environment settings; **do not upload `.env` files to GitHub**.
2. On Aiven's SQL console, run `scripts/migrate-earnings.sql` **once**. `scripts/schema.sql` also includes the new tables for a fresh installation.
3. Rotate the previously shared HilltopAds API key; place the NEW key in Vercel environment variable `HILLTOPADS_API_KEY` (Production, server-side only), redeploy.
4. Visit `/admin/earnings`. The **Fetch provider report** button accesses documented `GET https://api.hilltopads.com/publisher/listStats` with `group=date,subId,zoneId`. Provider report is shown to admin only and *never credited automatically*.
5. Before crediting a user, arrange/document a **HilltopAds-supported user-specific SubID integration** with HilltopAds support. **The supplied zone 7463121 script contains no demonstrated per-user SubID parameter**, so shared-zone revenue cannot currently be attributed accurately. If the provider does not support a per-user mechanism with this tag, use separately approved zones per user (where feasible) or do not enable monetary credits. A link click or local visit is NOT an ad impression.
6. Once provider reports show verifiable user attribution, record each date/zone/SubID exactly once, with the gross amount, provider impressions, and a unique evidence reference. `gross_cents/2` goes to the user and any rounding remainder to the admin.
7. User dashboard shows available balance, credited total, pending payouts, paid-out amount, CPM and history. Minimum withdrawal request is $10. Admin manually reviews requests in `/admin/earnings`; marking paid is *accounting only* after you make the external payment.

**Important:** No automated cash transfers or automatic revenue attribution are claimed. Correctly credited revenue and settlement depend on confirmed source-side attribution, provider adjustments, fraud review, tax/payout compliance, and completed external transfers. Monetag account revenue is not imported, and remains separately managed by the site owner.

**Future:** For true automatic user-level settlement, HilltopAds must confirm the exact supported SubID passing method for the verified banner or another monetized format. Then implement a durable mapping and validated parser matching an actual API sample response, and add reconciliation of later provider adjustments before making funds withdrawable.
