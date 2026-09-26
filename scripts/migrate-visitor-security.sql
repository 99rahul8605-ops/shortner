-- RUN BEFORE deploying the visitor-security patch. Safe for existing users,
-- links and earnings: it creates only the new short-lived visit-state table.
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY,
  slug VARCHAR(40) NOT NULL,
  step SMALLINT NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
  stage VARCHAR(16) NOT NULL DEFAULT 'popup'
    CHECK (stage IN ('popup', 'timing', 'revealed', 'final', 'complete')),
  route_token_hash CHAR(64) NOT NULL,
  continue_token_hash CHAR(64),
  popup_at BIGINT NOT NULL,
  started_at BIGINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS visitor_sessions_expiry_idx ON visitor_sessions (expires_at);

-- Reuse the request-limits table already used by account login. Safe if it exists.
CREATE TABLE IF NOT EXISTS request_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);
