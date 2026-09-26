-- Run ONCE before deploying this update to an existing BingoLink PostgreSQL database.
-- Existing accounts have NULL usernames and can keep signing in using their email
-- until they choose a username in Account Settings.
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique
  ON users (lower(username)) WHERE username IS NOT NULL;
-- Email ownership must be proved before password-recovery messages are delivered.
-- Existing verified_at/admin_created status is intentionally unchanged.
