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
