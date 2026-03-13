ALTER TABLE reservations ADD COLUMN access_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_reservations_access_token_hash
ON reservations (access_token_hash);
