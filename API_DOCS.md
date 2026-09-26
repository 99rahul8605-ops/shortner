# BingoLink Developer API — v1

Base URL: `https://bingolink.site`. After email verification, open `/dashboard` and generate your secret API key. Copy it immediately: the database stores only its SHA-256 hash. Do not expose keys in a webpage or publicly accessible repository. Revoke compromised keys in the dashboard.

Send `Authorization: Bearer bl_live_YOUR_KEY` on every developer API request. API responses are JSON. Each key operates only on links owned by its creator. Maximum 5 active keys per verified account.

| Method | Endpoint | JSON input | Success |
|---|---|---|---|
| POST | `/api/v1/links` | `{ "destination": "https://example.com", "title": "Example", "slug": "my-alias" }` | `201 {"link":{...}}` |
| GET | `/api/v1/links` | none | `200 {"links":[...]}` up to 100 |
| GET | `/api/v1/links/123` | none | `200 {"link":{...}}` including click count |
| PATCH | `/api/v1/links/123` | any combination of `destination`, `title`, `enabled` | `200 {"link":{...}}` |
| DELETE | `/api/v1/links/123` | none | `200 {"deleted":true}` |

`destination`: valid HTTP or HTTPS URL (up to 2048 chars, no credentials). `title`: up to 150 chars. `slug`: optional 3–40 lowercase letters, numbers, hyphens or underscores. Short URL: `https://bingolink.site/s/{slug}`. Clicks are recorded visits, **not** advertising earnings. The short URL sends visitors through the currently configured article page sequence.

## cURL: every developer call

```bash
# 1. Create
curl -X POST https://bingolink.site/api/v1/links \
  -H 'Authorization: Bearer bl_live_YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"destination":"https://example.com","title":"Example article","slug":"example-123"}'

# 2. List
curl https://bingolink.site/api/v1/links -H 'Authorization: Bearer bl_live_YOUR_KEY'

# 3. Get details
curl https://bingolink.site/api/v1/links/123 -H 'Authorization: Bearer bl_live_YOUR_KEY'

# 4. Update (including pausing a link)
curl -X PATCH https://bingolink.site/api/v1/links/123 \
  -H 'Authorization: Bearer bl_live_YOUR_KEY' \
  -H 'Content-Type: application/json' -d '{"enabled":false}'

# 5. Delete
curl -X DELETE https://bingolink.site/api/v1/links/123 \
  -H 'Authorization: Bearer bl_live_YOUR_KEY'
```

## Browser session endpoints (same-origin only)

Public accounts use an HttpOnly browser cookie, not developer API keys. Browser frontends must send same-origin requests.

| Method | Path | JSON body | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "email": "a@b.com", "password": "12+ characters" }` | Create user, send email verification |
| POST | `/api/auth/verify` | `{ "token": "token-from-email" }` | Verify email |
| POST | `/api/auth/resend` | `{ "email": "a@b.com" }` | Resend pending verification |
| POST | `/api/auth/login` | `{ "email": "a@b.com", "password": "..." }` | Set signed user cookie |
| POST | `/api/auth/logout` | none | Clear cookie |
| POST | `/api/auth/forgot` | `{ "email": "a@b.com" }` | Send reset link, generic success message |
| POST | `/api/auth/reset` | `{ "token": "...", "password": "new 12+ characters" }` | Change password and invalidate sessions |
| GET | `/api/account/links` | none | Your up to 100 links |
| POST | `/api/account/links` | destination/title/slug | Create your link |
| PATCH | `/api/account/links/{id}` | destination/title/enabled | Change your link |
| DELETE | `/api/account/links/{id}` | none | Delete your link |
| GET | `/api/account/keys` | none | Key metadata only |
| POST | `/api/account/keys` | `{ "name": "My app" }` | Create/show a secret once |
| DELETE | `/api/account/keys/{id}` | none | Revoke key |
| POST | `/api/report` | `{ "slug": "bad-link", "reason": "phishing", "details": "..." }` | Submit abuse report |

### Errors and limits

- `400` bad input; `401` bad API key/credentials; `403` unverified account/invalid origin; `404` not found or link not owned; `409` alias collision; `429` rate limit.
- API creation: **60/hour/account**; list and update: **120/hour/account**; browser creation: **30/hour/account**; maximum **5 active API keys**. Registration/login/reset endpoints also have per-IP database-backed limits. Add Cloudflare edge rules before opening registrations broadly.
- For public launch: email verification provider credentials (`RESEND_API_KEY`, `EMAIL_FROM`) are required. HTTPS and appropriate legal notices are also required.

## Owner-admin endpoints (owner session only, **not** developer API keys)

The existing owner account is configured separately through `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`. After logging in at `/admin/login`, the browser can make these **same-origin, cookie-authenticated** requests:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Owner login, body `{"username":"...","password":"..."}` |
| POST | `/api/admin/logout` | Log out owner |
| POST | `/api/admin/links` | Create owner link |
| PATCH | `/api/admin/links/{id}` | Modify owner-managed link |
| DELETE | `/api/admin/links/{id}` | Delete owner-managed link |
| POST | `/api/admin/settings` | Update ad/timer settings (see current form) |
| POST | `/api/admin/direct-links` | Add approved sponsor link |
| PATCH | `/api/admin/direct-links/{id}` | Edit sponsor link |
| DELETE | `/api/admin/direct-links/{id}` | Remove sponsor link |
| PATCH | `/api/admin/users/{id}` | Suspend/reactivate an account, body `{"disabled":true}` |

The owner UI is at `/admin` and `/admin/users`. Owner endpoints require an HttpOnly owner session cookie and same-origin requests. Do not use owner cookies in developer integrations.

## Visitor endpoints (no account required)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/s/{slug}` | Start visitor session, record visit and redirect to article step 1 |
| GET | `/go/{slug}/{step}` | Show permitted visitor step (1 through 4) |
| POST | `/api/continue` | Advance after signed-cookie timer, JSON body `{"slug":"abc123","step":1}`; response `{ "next": "/go/abc123/2" }` or final destination |

Visitor timers and progress are validated server-side. Ad clicks are optional and not part of the API.
