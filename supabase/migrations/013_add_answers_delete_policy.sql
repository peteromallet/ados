-- Add DELETE policy for answers table so users can delete their own answers
CREATE POLICY "Users can delete own answers"
  ON answers FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM attendance 
      WHERE attendance.id = answers.attendance_id 
      AND attendance.user_id = auth.uid()
    )
  );

