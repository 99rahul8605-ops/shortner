# BingoLink — Personal URL shortener (Next.js + Aiven PostgreSQL)

Personal owner-only admin, 3 genuine article pages (30 seconds each), final Get Link (10 seconds). Ads are optional and **disabled by default**. User-supplied `public/sw.js` is included unchanged; official Monetag script/zone setup must be confirmed for this domain and its traffic. There are no fake Continue buttons or automatic ad clicks.

## Getting started

1. Install Node.js 20+ (Vercel handles production). `npm install`.
2. Copy `.env.example` to `.env.local`. Fill in your **newly rotated** Aiven database URL (do not post it in chats or commit it). Use URL percent-encoding for password characters such as `@`, `?`, `#`.
3. Configure TLS: download your Aiven project CA certificate. `PG_CA_CERT_BASE64` should be the single-line base64 encoding of the certificate PEM. On Linux/macOS: `base64 -w 0 ca.pem`. TLS certificate validation is ON; do not disable it in production.
4. Set `APP_SECRET` to a randomly generated string of at least 32 characters, e.g. `openssl rand -hex 32`.
5. Generate your admin password hash with `npm run hash-password -- 'A-unique-long-password'` and paste output into `ADMIN_PASSWORD_HASH`.
6. Initialize Aiven DB tables: `node --env-file=.env.local scripts/init-db.mjs` (Node 20+ supports this). This command runs the idempotent SQL schema.
7. Run `npm run dev`, log in at `http://localhost:3000/admin/login`, and create a short link.
8. Deploy to Vercel: push to a **private** GitHub repository, import the repo as a Next.js project, and set the env variables in Vercel Project Settings → Environment Variables. For `DATABASE_URL`, include the full Aiven connection URL. Add `PG_CA_CERT_BASE64`, `APP_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL`. Deploy.
9. Add `bingolink.site` and optionally `www.bingolink.site` under Vercel Project Settings → Domains. Add the exact DNS records **shown by Vercel** to Cloudflare DNS. Start with DNS only (grey cloud), verify HTTPS, and only then enable Cloudflare proxy if desired. Domain registrar can stay GoDaddy; Cloudflare nameservers should already be active.
10. In `/admin`, add the official HTTPS ad script URL(s) from your approved Monetag zone. `sw.js` lives at `https://bingolink.site/sw.js` for the previously supplied zone configuration. Follow Monetag's exact instructions on whether and how its tag registers the worker; this app does not automatically register it. Get Monetag confirmation that your shortener traffic and article interstitials are eligible before enabling advertising.

## Structure

- `/` basic public homepage
- `/admin/login` owner-only authentication
- `/admin` link management, simple visit counts, optional ad script settings, timers
- `/s/{slug}` starts a visitor session and records a visit
- `/go/{slug}/1` through `/go/{slug}/3` article pages; `/go/{slug}/4` final timer
- `/api/continue` validates a signed HttpOnly progress cookie and elapsed server time before advancing

## Operational notes

- Ad display depends on advertiser inventory and provider-approved formats; the text placeholders are **not** real banner ads. This project cannot guarantee revenue or that every script URL is compatible.
- User-provided `public/sw.js` imports remote JavaScript. Review and approve that script/zone in your Monetag panel before using it. Its code and domain are not an instruction to trust arbitrary external scripts.
- Example privacy/terms pages are draft templates and need contact information, a consent approach if applicable, and applicable legal review before real traffic.
- This is a personal MVP, not production scale abuse-defense. For launch, add Cloudflare rate limits on `/s/*` and login endpoint, CAPTCHA after suspicious activity, ad provider fraud screening, backups, availability monitoring, and a report-abuse contact.
- Only the admin can create links. Visitors never get admin controls. Do not turn off server timer validation unless you intentionally redesign the flow.
- Clicking an ad or accepting browser notifications is never required for a visitor to unlock a link.
- The root `.env.local` is ignored by git. If a database URL was disclosed, rotate the password **before launch**.
