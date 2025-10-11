-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to send approval notification via edge function
CREATE OR REPLACE FUNCTION send_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  event_name TEXT;
  request_id BIGINT;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Get event name
    SELECT name INTO event_name
    FROM events
    WHERE id = NEW.event_id;
    
    -- Log the approval for monitoring
    RAISE LOG 'APPROVAL: User % approved for event % (attendance_id: %)', user_email, event_name, NEW.id;
    
    -- Call the edge function to send the email
    SELECT net.http_post(
      url := 'https://cyodlgfmrsvpocvgbykn.supabase.co/functions/v1/send-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', user_email,
        'event_name', event_name
      )
    ) INTO request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when attendance status changes
DROP TRIGGER IF EXISTS attendance_status_changed ON attendance;
CREATE TRIGGER attendance_status_changed
  AFTER INSERT OR UPDATE OF status ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION send_approval_notification();

