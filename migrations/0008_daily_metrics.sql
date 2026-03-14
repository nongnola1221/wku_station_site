CREATE TABLE IF NOT EXISTS daily_metrics (
  date_key TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (date_key, metric_key)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_updated_at
ON daily_metrics (updated_at);
