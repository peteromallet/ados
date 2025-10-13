-- Add composite index for faster attendance lookups
-- This optimizes the common query pattern: WHERE user_id = ? AND event_id = ?
CREATE INDEX IF NOT EXISTS idx_attendance_user_event ON attendance(user_id, event_id);

-- Also add an index for status queries which are common in admin views
CREATE INDEX IF NOT EXISTS idx_attendance_event_status ON attendance(event_id, status);

-- Optimize invites table queries
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);

-- Add index for event slug lookups (might already exist, but ensuring)
CREATE INDEX IF NOT EXISTS idx_events_slug_active ON events(slug, is_active);

