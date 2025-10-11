-- Seed data for testing
-- Note: Run this AFTER setting up authentication and having at least one user

-- Insert sample events
INSERT INTO events (name, slug, description, long_description, date, location, max_attendees, is_active)
VALUES 
  (
    'ADOS 2025',
    'ados-2025',
    'The premiere event celebrating art and open-source AI',
    'Join us for a full day of workshops, talks, and networking with artists and AI developers from around the world. ADOS 2025 will feature cutting-edge demonstrations of open-source AI tools, collaborative art projects, and discussions about the future of creative AI.

We''ll have sessions on:
- Stable Diffusion and ComfyUI workflows
- Open-source video generation tools
- Building AI art applications
- Ethics in AI art
- Community showcase

This is a unique opportunity to connect with like-minded creators and learn from experts in the field.',
    '2025-11-15 10:00:00+00',
    'San Francisco, CA',
    200,
    true
  ),
  (
    'ADOS Workshop: ComfyUI Masterclass',
    'comfyui-masterclass',
    'Deep dive into ComfyUI workflows and custom nodes',
    'A hands-on workshop focused on mastering ComfyUI. Learn advanced workflows, create custom nodes, and optimize your AI art generation pipeline.

What you''ll learn:
- Advanced node structures
- Custom node development
- Performance optimization
- Integration with other tools
- Real-world project workflows

Prerequisites: Basic knowledge of AI image generation',
    '2025-10-20 14:00:00+00',
    'Online',
    50,
    true
  ),
  (
    'ADOS Meetup: AI Art Showcase',
    'ai-art-showcase',
    'Monthly meetup to showcase AI art projects and network',
    'A casual meetup for AI artists to showcase their latest projects, get feedback, and network with the community. Bring your work and be ready to share your process!

Format:
- Lightning talks (5 min each)
- Open showcase
- Networking session
- Q&A with experienced artists

All skill levels welcome!',
    '2025-09-30 18:00:00+00',
    'New York, NY',
    30,
    true
  );

-- Get event IDs (you'll need to adjust these based on actual UUIDs)
-- For now, we'll use variables
DO $$
DECLARE
  event_ados_id UUID;
  event_comfyui_id UUID;
  event_meetup_id UUID;
BEGIN
  -- Get event IDs
  SELECT id INTO event_ados_id FROM events WHERE slug = 'ados-2025';
  SELECT id INTO event_comfyui_id FROM events WHERE slug = 'comfyui-masterclass';
  SELECT id INTO event_meetup_id FROM events WHERE slug = 'ai-art-showcase';

  -- Insert questions for ADOS 2025
  INSERT INTO questions (event_id, question_text, question_type, order_index, is_required, placeholder, helper_text)
  VALUES 
    (event_ados_id, 'Who are you? (link, writing, bio)', 'textarea', 1, true, NULL, 'If we don''t already know you! And why you''d like to join if it''s not obvious.'),
    (event_ados_id, 'Which would you like to attend?', 'multiple_choice', 2, true, NULL, NULL),
    (event_ados_id, 'Is there anything you''d like to contribute as part of the event?', 'textarea', 3, false, 'Host a roundtable, show something you made, etc.', 'Please share specifics, we''ll be in touch if it''s a good fit.'),
    (event_ados_id, 'Do you need travel support?', 'multiple_choice', 4, true, NULL, 'We have limited travel support and will prioritise open source contributors who are most in-need.'),
    (event_ados_id, 'Where will you travel from?', 'text', 5, false, NULL, NULL);

  -- Update the attendance question with options
  UPDATE questions 
  SET options = '["Day-time: panels, roundtables, hangouts", "Evening: show, drinks, frivolities", "Both"]'::jsonb
  WHERE event_id = event_ados_id AND question_text = 'Which would you like to attend?';

  -- Update the travel support question with options
  UPDATE questions 
  SET options = '["No", "Yes, I won''t be able to make it without", "It''d be nice but I can make it without it"]'::jsonb
  WHERE event_id = event_ados_id AND question_text = 'Do you need travel support?';

  -- Insert questions for ComfyUI Masterclass
  INSERT INTO questions (event_id, question_text, question_type, order_index, is_required)
  VALUES 
    (event_comfyui_id, 'What is your name?', 'text', 1, true),
    (event_comfyui_id, 'Do you have experience with ComfyUI?', 'multiple_choice', 2, true),
    (event_comfyui_id, 'What would you like to learn in this workshop?', 'textarea', 3, true),
    (event_comfyui_id, 'Have you created custom nodes before?', 'multiple_choice', 4, true);

  -- Update multiple choice options for ComfyUI questions
  UPDATE questions 
  SET options = '["No experience", "Basic usage", "Intermediate", "Advanced"]'::jsonb
  WHERE event_id = event_comfyui_id AND order_index = 2;

  UPDATE questions 
  SET options = '["Yes", "No", "Want to learn"]'::jsonb
  WHERE event_id = event_comfyui_id AND order_index = 4;

  -- Insert questions for AI Art Showcase
  INSERT INTO questions (event_id, question_text, question_type, order_index, is_required)
  VALUES 
    (event_meetup_id, 'What is your name?', 'text', 1, true),
    (event_meetup_id, 'Will you be presenting a project?', 'multiple_choice', 2, true),
    (event_meetup_id, 'If yes, briefly describe your project', 'textarea', 3, false),
    (event_meetup_id, 'What tools do you primarily use?', 'text', 4, false);

  -- Update multiple choice options
  UPDATE questions 
  SET options = '["Yes, I want to present", "No, just attending", "Maybe"]'::jsonb
  WHERE event_id = event_meetup_id AND order_index = 2;

END $$;

