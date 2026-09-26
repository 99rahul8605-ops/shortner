-- Run once against your existing Aiven database; does not delete links or visit statistics.
CREATE TABLE IF NOT EXISTS direct_links (
 id BIGSERIAL PRIMARY KEY,
 label VARCHAR(100) NOT NULL,
 url TEXT NOT NULL CHECK (url ~* '^https://'),
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
