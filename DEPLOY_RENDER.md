# Deploy this complete V4 ZIP to Render

1. Back up the existing GitHub repo and database. Extract this ZIP into the repository **root**, alongside `package.json`. Do not nest it inside another `app` folder.
2. GitHub: commit all project files (never real `.env` or `.env.local`).
3. Render service: Docker runtime, root directory = repository root. Deploy latest GitHub commit.
4. Render Environment: set `DATABASE_URL`, `PG_CA_CERT_BASE64` (your Aiven PEM in base64), `APP_SECRET` (at least 32 random characters), `ADMIN_USERNAME=admin`, `ADMIN_PASSWORD` (your PRIVATE plain password, at least 8 characters), and `NEXT_PUBLIC_SITE_URL=https://shortner-ajk5.onrender.com`. Configure Resend email variables if public registration is desired. Remove the old `ADMIN_PASSWORD_HASH`; this edition does not use it for owner login.
5. Only when deployment status is Live, open `/admin/login`. Login username is `admin` or the configured `ADMIN_USERNAME`.
6. To diagnose origin only, send a POST with the public Origin header and a deliberately wrong password; expected HTTP **401**, not 403. Never paste your real password into a support chat or URL.

Admin password is plain text in your private Render environment in this edition because you requested it. This is less protective than a bcrypt hash. Keep it unique and rotate any exposed credentials. Public users' passwords still use bcrypt hashes in the database.

This is based on the V4 ZIP you uploaded, not the live GitHub branch. Test the application before replacing any newer GitHub changes.
