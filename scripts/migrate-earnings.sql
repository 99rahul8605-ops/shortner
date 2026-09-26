-- Apply once to existing BingoLink PostgreSQL database. Financial amounts use integer USD cents.
-- Only import revenue verifiably attributable to a user; raw visit counts are never money.
CREATE TABLE IF NOT EXISTS revenue_entries (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 revenue_date DATE NOT NULL,
 provider TEXT NOT NULL DEFAULT 'hilltopads' CHECK (provider='hilltopads'),
 zone_id TEXT NOT NULL,
 sub_id TEXT NOT NULL,
 evidence_ref TEXT NOT NULL UNIQUE,
 gross_cents BIGINT NOT NULL CHECK (gross_cents>=0),
 user_cents BIGINT GENERATED ALWAYS AS (gross_cents / 2) STORED,
 impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE (provider,revenue_date,zone_id,sub_id)
);
CREATE INDEX IF NOT EXISTS revenue_entries_user_idx ON revenue_entries(user_id,revenue_date DESC);
CREATE TABLE IF NOT EXISTS payout_requests (
 id BIGSERIAL PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 amount_cents BIGINT NOT NULL CHECK (amount_cents>=1000),
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','paid','rejected')),
 requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 reviewed_at TIMESTAMPTZ,
 admin_note VARCHAR(500) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS payout_requests_user_idx ON payout_requests(user_id,requested_at DESC);
