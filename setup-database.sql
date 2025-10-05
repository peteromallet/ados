-- This file combines the migration and seed data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cyodlgfmrsvpocvgbykn/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_username TEXT,
  discord_id TEXT UNIQUE,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  max_attendees INTEGER,
  is_active BOOLEAN DEFAULT true,
  banner_image_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table (per event)
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',
  options JSONB,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance/Applications table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(user_id, event_id)
);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attendance_id, question_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_questions_event_id ON questions(event_id);
CREATE INDEX IF NOT EXISTS idx_answers_attendance_id ON answers(attendance_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Active events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Questions are viewable for active events" ON questions;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own answers" ON answers;
DROP POLICY IF EXISTS "Users can create own answers" ON answers;

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: Everyone can read active events
CREATE POLICY "Active events are viewable by everyone"
  ON events FOR SELECT USING (is_active = true);

-- Questions: Everyone can read questions for active events
CREATE POLICY "Questions are viewable for active events"
  ON questions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = questions.event_id 
      AND events.is_active = true
    )
  );

-- Attendance: Users can read their own attendance, insert their own
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Answers: Users can read/write their own answers
CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM attendance 
      WHERE attendance.id = answers.attendance_id 
      AND attendance.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own answers"
  ON answers FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM attendance 
      WHERE attendance.id = answers.attendance_id 
      AND attendance.user_id = auth.uid()
    )
  );

-- Insert ADOS 2025 event (only if it doesn't exist)
INSERT INTO events (name, slug, description, long_description, date, location, max_attendees, is_active)
SELECT 
  'ADOS 2025',
  'ados-2025',
  'The premiere event celebrating art and open-source AI',
  'Join us for a full day of workshops, talks, and networking with artists and AI developers from around the world.',
  '2025-11-07 10:00:00+00',
  'Los Angeles, CA',
  200,
  true
WHERE NOT EXISTS (SELECT 1 FROM events WHERE slug = 'ados-2025');

-- Insert questions for ADOS 2025
DO $$
DECLARE
  event_ados_id UUID;
BEGIN
  SELECT id INTO event_ados_id FROM events WHERE slug = 'ados-2025';
  
  -- Delete existing questions first to avoid duplicates
  DELETE FROM questions WHERE event_id = event_ados_id;
  
  -- Insert questions
  INSERT INTO questions (event_id, question_text, question_type, order_index, is_required)
  VALUES 
    (event_ados_id, 'Who are you? (link, writing, bio)', 'textarea', 1, true),
    (event_ados_id, 'Why would you like to join?', 'textarea', 2, true),
    (event_ados_id, 'Which would you like to attend?', 'multiple_select', 3, true),
    (event_ados_id, 'Do you need travel support?', 'multiple_choice', 4, true),
    (event_ados_id, 'Where will you travel from?', 'text', 5, false);

  -- Update the multiple select question with options
  UPDATE questions 
  SET options = '["Day-time: panels, roundtables, hangouts", "Evening: show, drinks, frivolities"]'::jsonb
  WHERE event_id = event_ados_id AND question_type = 'multiple_select';

  -- Update the multiple choice question with options
  UPDATE questions 
  SET options = '["No", "Yes, I won''t be able to make it without", "It''d be nice but I can make it without it"]'::jsonb
  WHERE event_id = event_ados_id AND question_type = 'multiple_choice';
END $$;
