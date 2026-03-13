CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  reservation_date TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  duration_hours INTEGER NOT NULL CHECK (duration_hours IN (1, 2)),
  representative_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  people_count INTEGER NOT NULL,
  consent_checked INTEGER NOT NULL DEFAULT 0,
  signature_confirmed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reservations_lookup
ON reservations (reservation_date, station_id, start_hour, end_hour, status);

CREATE INDEX IF NOT EXISTS idx_reservations_phone_date
ON reservations (phone, reservation_date, status);
