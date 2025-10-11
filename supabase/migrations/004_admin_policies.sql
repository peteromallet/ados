-- Add admin role support
-- This migration adds admin functionality and improves RLS policies

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ENHANCED POLICIES FOR EVENTS
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Active events are viewable by everyone" ON events;

-- Everyone can view active events
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT 
  USING (is_active = true);

-- Admins can view all events (including inactive)
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT 
  USING (is_admin());

-- Admins can create events
CREATE POLICY "Admins can create events"
  ON events FOR INSERT 
  WITH CHECK (is_admin());

-- Admins can update events
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE 
  USING (is_admin());

-- Admins can delete events
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE 
  USING (is_admin());

-- ========================================
-- ENHANCED POLICIES FOR QUESTIONS
-- ========================================

-- Drop existing policy
DROP POLICY IF EXISTS "Questions are viewable for active events" ON questions;

-- Everyone can view questions for active events
CREATE POLICY "Anyone can view questions for active events"
  ON questions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = questions.event_id 
      AND events.is_active = true
    )
  );

-- Admins can view all questions
CREATE POLICY "Admins can view all questions"
  ON questions FOR SELECT 
  USING (is_admin());

-- Admins can manage questions
CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE 
  USING (is_admin());

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE 
  USING (is_admin());

-- ========================================
-- ENHANCED POLICIES FOR ATTENDANCE
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance;

-- Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT 
  USING (is_admin());

-- Users can create their own attendance
CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can update attendance (for reviewing applications)
CREATE POLICY "Admins can update attendance"
  ON attendance FOR UPDATE 
  USING (is_admin());

-- ========================================
-- ENHANCED POLICIES FOR ANSWERS
-- ========================================

-- Admins can view all answers
CREATE POLICY "Admins can view all answers"
  ON answers FOR SELECT 
  USING (is_admin());

-- Admins can manage answers if needed
CREATE POLICY "Admins can update answers"
  ON answers FOR UPDATE 
  USING (is_admin());

CREATE POLICY "Admins can delete answers"
  ON answers FOR DELETE 
  USING (is_admin());

-- ========================================
-- ENHANCED POLICIES FOR PROFILES
-- ========================================

-- Admins can update any profile (for role management)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE 
  USING (is_admin());

