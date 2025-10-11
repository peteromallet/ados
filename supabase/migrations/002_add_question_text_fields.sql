-- Add placeholder and helper_text fields to questions table
ALTER TABLE questions 
ADD COLUMN placeholder TEXT,
ADD COLUMN helper_text TEXT;

