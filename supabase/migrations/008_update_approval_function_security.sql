-- Update the approval notification function to use attendance_id instead of passing raw email
-- This improves security by having the edge function validate against the database
CREATE OR REPLACE FUNCTION send_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Log the approval for monitoring
    RAISE LOG 'APPROVAL: Sending approval email for attendance_id: %', NEW.id;
    
    -- Call the edge function with just the attendance_id
    -- The edge function will validate and fetch the data itself
    SELECT net.http_post(
      url := 'https://cyodlgfmrsvpocvgbykn.supabase.co/functions/v1/send-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'attendance_id', NEW.id::text
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add email_sent_at column to track when approval emails were sent
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying attendees by email sent status
CREATE INDEX IF NOT EXISTS idx_attendance_email_sent ON attendance(email_sent_at) WHERE status = 'approved';

-- Add comment explaining the new column
COMMENT ON COLUMN attendance.email_sent_at IS 'Timestamp when the approval email was sent to the user';

