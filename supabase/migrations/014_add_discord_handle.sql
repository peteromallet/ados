-- Add discord_handle column to store the actual Discord username/handle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_handle TEXT;

-- Update existing profiles to set discord_handle from discord_username if it looks like a handle
-- This is a one-time backfill, new users will have both fields populated correctly
UPDATE profiles 
SET discord_handle = discord_username 
WHERE discord_handle IS NULL AND discord_username IS NOT NULL;

