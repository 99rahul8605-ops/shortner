CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(40) UNIQUE NOT NULL,
  destination TEXT NOT NULL,
  title VARCHAR(150) NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT destination_http CHECK (destination ~* '^https?://')
);
CREATE TABLE IF NOT EXISTS visits (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  country VARCHAR(3),
  ip_hash VARCHAR(64),
  ua_hash VARCHAR(64)
);
CREATE INDEX IF NOT EXISTS visits_link_time_idx ON visits (link_id, visited_at DESC);
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(60) PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT INTO settings(key,value) VALUES
 ('monetag_script_url',''),('inpage_script_url',''),('ads_enabled','false'),
 ('ad_1_seconds','30'),('ad_2_seconds','30'),('ad_3_seconds','30'),('final_seconds','10')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS direct_links (
  id BIGSERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  url TEXT NOT NULL CHECK (url ~* '^https://'),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public users and scoped developer API keys. Existing personal links retain NULL owner_id.
CREATE TABLE IF NOT EXISTS users (
 id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 email_verified_at TIMESTAMPTZ, session_version INTEGER NOT NULL DEFAULT 0, disabled BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE links ADD COLUMN IF NOT EXISTS owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS links_owner_idx ON links(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS account_tokens (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose VARCHAR(16) NOT NULL CHECK (purpose IN ('verify','reset')), token_hash VARCHAR(64) UNIQUE NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS api_keys (
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 name VARCHAR(80) NOT NULL, key_prefix VARCHAR(24) NOT NULL, key_hash VARCHAR(64) UNIQUE NOT NULL,
 last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
CREATE TABLE IF NOT EXISTS request_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 1, expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS abuse_reports (
 id BIGSERIAL PRIMARY KEY, link_id BIGINT REFERENCES links(id) ON DELETE SET NULL,
 slug VARCHAR(40) NOT NULL, reason VARCHAR(60) NOT NULL, details VARCHAR(1000) NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- Allows owner-provisioned test users to sign in before email delivery is configured.
-- This is NOT email verification. Existing users stay unaffected.
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_created BOOLEAN NOT NULL DEFAULT FALSE;

-- Editable visitor popup text. Safe to run on existing BingoLink V3 installations.
INSERT INTO settings(key,value) VALUES
 ('popup_title','YOUR LINK IS ALMOST READY'),
 ('popup_intro','Explore sponsored content while you wait.'),
 ('popup_heading','SPONSORED CONTENT'),
 ('popup_description','You may explore the advertisement below and return to this page.'),
 ('popup_orange_label','VIEW SPONSORED AD'),
 ('popup_blue_label','EXPLORE AD'),
 ('popup_middle_note','ADVERTISEMENT · OPENS IN A NEW TAB')
ON CONFLICT (key) DO NOTHING;
