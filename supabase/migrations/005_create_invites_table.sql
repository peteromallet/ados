-- Create invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster code lookups
CREATE INDEX idx_invites_code ON invites(code);

-- Enable Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Everyone can read invites (to validate codes)
CREATE POLICY "Invites are viewable by everyone"
  ON invites FOR SELECT USING (true);

-- Add invite_code to attendance table to track which invite was used
ALTER TABLE attendance ADD COLUMN invite_code TEXT REFERENCES invites(code);

-- Insert sample invite for Nathan Shipley
INSERT INTO invites (code, name, max_uses, used_count)
VALUES ('NATHAN2025', 'Nathan Shipley', 5, 0);

