# BingoLink V3 — public shortener + developer API

**Next.js 15 + Aiven PostgreSQL + Vercel.** Upgrades BingoLink V2 without deleting your current `links`, `visits`, `settings` or `direct_links`. New visitors can register with their own email/password, verify their email, manage their own links and generate scoped API keys. Your existing owner `/admin/login` and `/admin` continue to work separately. `public/sw.js` is carried forward from V2; confirm its domain and service-worker zone still correspond to YOUR current Monetag installation.

## V3 additions

- `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify`, `/resend-verification`.
- Passwords are bcrypt hashed. Verification and recovery use random one-time tokens hashed in PostgreSQL; tokens expire in 30 minutes. Password reset invalidates prior user sessions. Account sessions use signed HttpOnly 7-day cookies.
- `/dashboard`: create your own short links, enable/disable/delete, view recorded clicks, generate/revoke up to five API keys. Full key shown **once**; only a SHA-256 hash stored. User link ownership is enforced by SQL on each endpoint.
- `/developers` and `API_DOCS.md`: list every supported API call and cURL usage. Token-auth API endpoints are under `/api/v1/links`.
- Owner-only `/admin/users`: review registrants, suspend users, review reports. Suspensions invalidate existing account sessions and API authentication.
- `/report`: visitors can report dangerous links. Owner must actually review reports.
- Rate limiting in PostgreSQL for registration, login, recovery, key creation, and creation API calls. **Before public launch**, also turn on Cloudflare WAF/Bot Management or CAPTCHA and establish an abuse response policy.
- Monetag remains enabled only on visitor `/go/...` pages when toggled on; homepage/dashboard/login/user dashboard do not load Monetag. Existing V2 popup and article page layout retained. Ad click is optional.

## Upgrade existing site on Vercel

1. **Back up your Aiven database first.** Do not publish old `.env.local` or old database passwords. If credentials were exposed in chat, rotate them.
2. Update your existing private GitHub repo **with the contents of this ZIP** (files at repo root, including `app`, `components`, `lib`, `scripts`, `public`). Do not replace Vercel environment variables with an example file.
3. Existing required Vercel environment variables: `DATABASE_URL`, `PG_CA_CERT_BASE64`, `APP_SECRET` (at least 32 characters), `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL=https://bingolink.site`.
4. **New required env vars for public registration:** `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `BingoLink <no-reply@bingolink.site>`). Verify your sending domain with your mail provider and follow its DNS instructions. Public registration **fails closed** until configured. Domain inbox and deliverability depend on your provider. Never put API keys in GitHub.
5. Run the safe, additive migration once from your trusted terminal (same `.env.local` settings as before):

   ```bash
   npm install
   node --env-file=.env.local scripts/init-db.mjs
   ```

   It uses `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; existing rows remain. Confirm `users`, `account_tokens`, `api_keys`, `request_limits`, and `abuse_reports` exist in Aiven.
6. Commit to GitHub; let Vercel build a **Preview** deployment first. Configure all new env vars on Preview and Production if you want both to work. Check Preview signup, emailed verification, user login, link creation, API key generation/cURL, and owner admin. Then promote to Production. New or changed env vars require a fresh deployment.
7. Confirm SSL and `https://bingolink.site/sw.js` return the correct current Monetag worker. If Monetag's installation check requires code on the homepage, ask its support about visitor-only loading rather than silently loading ads on your dashboard.
8. Update the drafts in `app/privacy/page.tsx` and `app/terms/page.tsx` with a real contact address and local legal compliance before accepting public signups. Public links attract spam/phishing; reporting and suspension tools are only a baseline.

## Core user-facing pages

- `/`: public landing page, no ads
- `/register`: email + password signup
- `/verify?token=...`: account email verification
- `/login`, `/forgot-password`, `/reset-password?token=...`
- `/dashboard`: account-specific links, analytics and developer API keys
- `/developers`: API documentation
- `/report`: link abuse reports
- `/admin/login`, `/admin`, `/admin/users`: **original owner-only** controls; no ads
- `/s/{slug}`: publicly shared link, records a visit and starts a timed session
- `/go/{slug}/{step}`: three article pages plus final Get Link, existing 30+30+30+10 seconds

## Developer documentation

See [API_DOCS.md](API_DOCS.md). Keys are intended for server-side applications only. `GET /api/v1/links` returns up to 100 links; add pagination before large-scale operation.

## Important caveats

This is an extensible MVP, **not a fully audited public shortener**. Public registration also needs production mail delivery, monitored abuse reports, backups, email reputation, bot defenses, terms/privacy review, user data deletion and likely stronger account protections (e.g. passkeys or MFA) before growing traffic. Database visits are **not** Monetag impressions or payable earnings. No automatic ad clicking or ad-click requirements are implemented.

The archive has been checked for project structure and import routes. Dependency installation and a full `next build` were not completed in the artifact environment; a real Vercel Preview build and end-to-end test are required before production promotion.

### Public registration is NOT enabled just by deploying code

Make sure the sender domain is verified with your mail provider, set the two new mail environment variables, run database migration, and complete a signup → inbox → verify → login → create link → API key → API call test on Vercel Preview first. Only then move to production. End-user billing, revenue sharing and automatic payouts are **not** included in V3.
