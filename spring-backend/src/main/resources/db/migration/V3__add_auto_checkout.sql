ALTER TABLE gym_visits ADD COLUMN auto_checked_out BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_gym_visits_open_checkin ON gym_visits(checked_out_at, checked_in_at);
