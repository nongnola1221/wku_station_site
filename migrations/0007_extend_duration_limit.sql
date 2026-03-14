CREATE TABLE reservations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  reservation_date TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  duration_hours INTEGER NOT NULL CHECK (duration_hours BETWEEN 1 AND 5),
  representative_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  people_count INTEGER NOT NULL,
  consent_checked INTEGER NOT NULL DEFAULT 0,
  signature_confirmed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  access_token_hash TEXT,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

INSERT INTO reservations_new (
  id,
  station_id,
  reservation_date,
  start_hour,
  end_hour,
  duration_hours,
  representative_name,
  phone,
  people_count,
  consent_checked,
  signature_confirmed,
  status,
  created_at,
  updated_at,
  access_token_hash
)
SELECT
  id,
  station_id,
  reservation_date,
  start_hour,
  end_hour,
  duration_hours,
  representative_name,
  phone,
  people_count,
  consent_checked,
  signature_confirmed,
  status,
  created_at,
  updated_at,
  access_token_hash
FROM reservations;

DROP TABLE reservations;

ALTER TABLE reservations_new RENAME TO reservations;

CREATE INDEX IF NOT EXISTS idx_reservations_lookup
ON reservations (reservation_date, station_id, start_hour, end_hour, status);

CREATE INDEX IF NOT EXISTS idx_reservations_phone_date
ON reservations (phone, reservation_date, status);

CREATE INDEX IF NOT EXISTS idx_reservations_access_token_hash
ON reservations (access_token_hash);
