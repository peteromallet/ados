-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_username TEXT,
  discord_id TEXT UNIQUE,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
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
CREATE TABLE questions (
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
CREATE TABLE attendance (
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
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attendance_id, question_id)
);

-- Indexes for performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_questions_event_id ON questions(event_id);
CREATE INDEX idx_answers_attendance_id ON answers(attendance_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

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

