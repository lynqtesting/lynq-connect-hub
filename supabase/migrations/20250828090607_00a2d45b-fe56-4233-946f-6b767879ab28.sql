-- Add foreign key constraint to preserve user assignments during module edits
ALTER TABLE user_module_assignments 
ADD CONSTRAINT fk_user_module_assignments_module_id 
FOREIGN KEY (module_id) 
REFERENCES modules(id) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;

-- Add index for better performance on module lookups
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_module_id 
ON user_module_assignments(module_id);

-- Add index for better performance on user lookups  
CREATE INDEX IF NOT EXISTS idx_user_module_assignments_user_id 
ON user_module_assignments(user_id);