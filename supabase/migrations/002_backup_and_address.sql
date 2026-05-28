-- Add client_address to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Add backup_dismissed_at to users (per-user dismiss tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_dismissed_at TIMESTAMPTZ;

-- System settings for global app config (e.g. last_backup_at)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value) VALUES ('last_backup_at', NULL) ON CONFLICT DO NOTHING;

-- Trigger to auto-update updated_at on system_settings
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS (service role bypasses)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
