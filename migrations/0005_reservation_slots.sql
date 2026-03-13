CREATE TABLE IF NOT EXISTS reservation_slots (
  reservation_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  reservation_date TEXT NOT NULL,
  hour_slot INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reservation_date, station_id, hour_slot),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

CREATE INDEX IF NOT EXISTS idx_reservation_slots_reservation_id
ON reservation_slots (reservation_id);

WITH RECURSIVE hour_ranges AS (
  SELECT
    id AS reservation_id,
    station_id,
    reservation_date,
    start_hour AS hour_slot,
    end_hour
  FROM reservations
  WHERE status = 'confirmed'

  UNION ALL

  SELECT
    reservation_id,
    station_id,
    reservation_date,
    hour_slot + 1,
    end_hour
  FROM hour_ranges
  WHERE hour_slot + 1 < end_hour
)
INSERT OR IGNORE INTO reservation_slots (
  reservation_id,
  station_id,
  reservation_date,
  hour_slot
)
SELECT
  reservation_id,
  station_id,
  reservation_date,
  hour_slot
FROM hour_ranges;
