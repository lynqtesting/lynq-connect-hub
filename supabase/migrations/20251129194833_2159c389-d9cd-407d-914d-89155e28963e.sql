-- Add module_id column to data_uploads table to link uploads to specific modules
ALTER TABLE data_uploads
ADD COLUMN module_id UUID REFERENCES modules(id) ON DELETE CASCADE;

-- Create index for better query performance when filtering by module
CREATE INDEX idx_data_uploads_module_id ON data_uploads(module_id);

-- Update RLS policies to allow users to view uploads for their assigned modules
CREATE POLICY "Users can view uploads for assigned modules"
ON data_uploads
FOR SELECT
USING (
  is_admin_user(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM user_module_assignments
    WHERE user_module_assignments.user_id = auth.uid()
    AND user_module_assignments.module_id = data_uploads.module_id
  )
);