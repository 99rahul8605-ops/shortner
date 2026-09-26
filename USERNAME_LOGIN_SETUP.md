# BingoLink username login and recovery deployment

This ZIP is the complete source snapshot based on the last advanced-dashboard version, with username/password login and recovery improvements. No production credentials are included. It has **not** been tested against your live Aiven database or deployed Vercel service.

## 1. Database migration (required before deploying)
Run `scripts/migrate-usernames.sql` in your Aiven SQL console. This adds a nullable, unique case-insensitive `username`. Existing users keep their accounts and links, can log in with their email, then visit `/account/settings` to choose a username.

## 2. Vercel environment variables
Set `NEXT_PUBLIC_SITE_URL=https://www.bingolink.site`, `APP_SECRET` (at least 32 random characters), `DATABASE_URL`, `PG_CA_CERT_BASE64`, `RESEND_API_KEY` and `EMAIL_FROM` (verified sender domain). Do not commit `.env*` or post keys in chat. Keep your existing monetization settings unchanged. Redeploy after updating variables.

## 3. What changes
- New users pick a unique username, 8–128 character password and recovery email.
- Username + password sign-in immediately; verifying email is **not** required to sign in or create links or API keys.
- Recovery email verification is required before password resets and payout requests. Verification is sent during registration when Resend is configured, and can be requested later.
- Existing email-based users can still log in with email until they set a username in Account Settings.
- Admin lists username, email, email-verification status, enabled/disabled state. Admin can send verification/password-reset links; existing passwords are **never** stored or displayed in plaintext. Admin-created test account passwords can be replaced and shown ONCE.
- One-time reset tokens expire after 30 minutes; resetting a password invalidates existing user sessions.

**Do not email or display existing passwords.** Only store bcrypt hashes. Recovery email must be verified before issuing password reset links, otherwise anyone could register with someone else's email then intercept/trigger recovery.

## 4. Testing checklist
1. Deploy to Vercel preview after migration, create a fresh test user with username/email/password.
2. Log in before verifying recovery email; create a short link and an API key.
3. Verify email by clicking the email link. Test forgot-password link expires / cannot be reused and invalidates old sessions.
4. Log in to an old account using its existing email, set username once at `/account/settings`, and re-login with username.
5. Verify admin `/admin/users` lists usernames and can send recovery emails without exposing passwords.
6. Test payouts blocked until email verified. Test all article/ads steps separately.

**Email delivery requires working Resend API and verified EMAIL_FROM; without it, sign-up/login work but account recovery will not.**
