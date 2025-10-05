-- Quick seed data for ADOS 2025 event
-- Run this AFTER the migration

INSERT INTO events (name, slug, description, long_description, date, location, max_attendees, is_active)
VALUES (
  'ADOS 2025',
  'ados-2025',
  'A celebration of art and open source AI',
  'Join us for a full day of workshops, talks, and networking with artists and AI developers from around the world. ADOS 2025 will feature cutting-edge demonstrations of open-source AI tools, collaborative art projects, and discussions about the future of creative AI.',
  '2025-11-07 10:00:00+00',
  'Los Angeles, CA',
  200,
  true
) RETURNING id;

-- Copy the event ID from above and replace 'YOUR_EVENT_ID_HERE' in the queries below

-- Example questions (replace YOUR_EVENT_ID_HERE with the actual UUID from above)
/*
INSERT INTO questions (event_id, question_text, question_type, order_index, is_required)
VALUES 
  ('YOUR_EVENT_ID_HERE', 'What is your name?', 'text', 1, true),
  ('YOUR_EVENT_ID_HERE', 'Tell us about your experience with AI art tools', 'textarea', 2, true),
  ('YOUR_EVENT_ID_HERE', 'What are you most excited to learn at ADOS?', 'textarea', 3, true),
  ('YOUR_EVENT_ID_HERE', 'What is your skill level?', 'multiple_choice', 4, true);

-- Add options to multiple choice question
UPDATE questions 
SET options = '["Beginner", "Intermediate", "Advanced", "Expert"]'::jsonb
WHERE question_text = 'What is your skill level?';
*/
