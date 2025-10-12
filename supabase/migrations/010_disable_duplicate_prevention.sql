-- Temporarily disable duplicate prevention to allow resending notifications
-- Comment out the email_sent_at check
CREATE OR REPLACE FUNCTION send_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Only process when status changes to 'approved'
  -- Duplicate prevention disabled: AND NEW.email_sent_at IS NULL
  IF NEW.status = 'approved' 
     AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Log the approval for monitoring
    RAISE LOG 'APPROVAL: Sending approval email for attendance_id: %', NEW.id;
    
    -- Call the edge function with just the attendance_id
    -- No authorization header needed - the edge function validates against the database
    SELECT net.http_post(
      url := 'https://cyodlgfmrsvpocvgbykn.supabase.co/functions/v1/send-approval-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'attendance_id', NEW.id::text
      )
    ) INTO request_id;
    
    RAISE LOG 'APPROVAL: Email request sent with request_id: %', request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

