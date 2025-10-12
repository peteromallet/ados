-- Add discord_id and invite_sent_at columns to invites table
ALTER TABLE invites ADD COLUMN IF NOT EXISTS discord_id TEXT;
ALTER TABLE invites ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying invites by sent status
CREATE INDEX IF NOT EXISTS idx_invites_sent ON invites(invite_sent_at) WHERE discord_id IS NOT NULL;

-- Add comment explaining the new columns
COMMENT ON COLUMN invites.discord_id IS 'Discord user ID (numeric) to send invite notification to';
COMMENT ON COLUMN invites.invite_sent_at IS 'Timestamp when the Discord invite notification was sent';

-- Create a function to send invite notification via edge function
CREATE OR REPLACE FUNCTION send_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
  request_id BIGINT;
BEGIN
  -- Only process when invite has discord_id and hasn't been sent yet
  IF NEW.discord_id IS NOT NULL 
     AND NEW.invite_sent_at IS NULL 
     AND (OLD.discord_id IS NULL OR OLD.discord_id IS DISTINCT FROM NEW.discord_id) THEN
    
    -- Log the invite notification for monitoring
    RAISE LOG 'INVITE: Sending Discord invite to % for code: %', NEW.discord_id, NEW.code;
    
    -- Call the edge function with the invite ID
    SELECT net.http_post(
      url := 'https://cyodlgfmrsvpocvgbykn.supabase.co/functions/v1/send-invite-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'invite_id', NEW.id::text
      )
    ) INTO request_id;
    
    RAISE LOG 'INVITE: Notification request sent with request_id: %', request_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when invites are created or updated
DROP TRIGGER IF EXISTS invite_discord_notification ON invites;
CREATE TRIGGER invite_discord_notification
  AFTER INSERT OR UPDATE OF discord_id ON invites
  FOR EACH ROW
  EXECUTE FUNCTION send_invite_notification();

