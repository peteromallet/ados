-- Update policy to allow admins to manage invites
-- Note: role field should already exist in profiles table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can insert invites" ON invites;
DROP POLICY IF EXISTS "Admins can update invites" ON invites;
DROP POLICY IF EXISTS "Admins can delete invites" ON invites;

-- Create new policies using role field
CREATE POLICY "Admins can insert invites"
  ON invites FOR INSERT 
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update invites"
  ON invites FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete invites"
  ON invites FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

