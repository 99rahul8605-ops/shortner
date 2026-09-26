# BingoLink V4 — visitor/ad/admin update

Based on the existing V3 popup-editable source. This is a complete replacement project, not a single-file patch.

## Changes
- Verified MultiTag is mounted only on visitor `/go/...` pages when Admin > Enable approved ad scripts is ON; the homepage, account, and admin areas have no ad script. Monetag controls ad fill and rendering: gray article blocks are labeled placeholders and do not themselves request in-page ads. Use an approved in-page format/zone if you require ads inside the article.
- Popup close becomes available after 15 seconds **without showing a numerical timer**. The article countdown starts only after the popup closes and the server issues a signed updated progress cookie. The timer is positioned immediately following the article's first advertisement area. Final step retains its 10-second countdown.
- Admin popup fields persist in `settings` and are passed to all visitor steps. **Preview popup (unsaved changes)** lets the admin inspect edits before saving. Open a NEW short-link session after saving to see changes live.
- Admin can create an admin-approved test account with a custom 6–128 character password or generated secure password, and reset admin-created users' passwords. The new password is displayed **one time**. Existing passwords are salted bcrypt hashes, so no plaintext password list is possible. Admin-created users can log in before email verification, but their email is truthfully shown as *unverified*.
- Registration/reset password minimum is 6 characters as requested. Longer unique passwords are safer; rate limits remain in place.

## Deploy
1. Back up your GitHub project and Aiven database. Replace **contents** of repo root with this project, not an extra nested `app/` wrapper. Confirm `app/go/[slug]/[step]/page.tsx` has `VisitorPopup ... labels=`.
2. Keep Vercel environment variables (`DATABASE_URL`, `PG_CA_CERT_BASE64`, `APP_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `NEXT_PUBLIC_SITE_URL`) secret. Do not upload `.env.local`.
3. Run `npm install` and `npm run build`, then commit files to the branch Vercel deploys.
4. On your local/terminal copy with `.env.local`, run `node --env-file=.env.local scripts/init-db.mjs` if prior database migrations haven't been run. This version has no new tables.
5. On your admin page, switch **Enable approved ad scripts** ON, save, and visit a fresh short link in a private tab (not the owner dashboard). Confirm browser DevTools shows `tag.min.js` loading only on public article pages and that popup labels match Admin Preview. Monetag may decide not to deliver ads for a particular visit.
6. For testing, create a test account from `/admin/users`, assign a custom 6+ character password or leave blank for a generated one. Existing passwords cannot be viewed; admin can reset admin-created testers.

## Security
Do not claim an admin-approved email was independently verified. When Resend is configured, users can verify the email they control. Do not label sponsored URLs as navigation or require ad clicks.
