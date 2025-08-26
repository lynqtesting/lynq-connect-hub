-- First, ensure consistent user ID usage across all tables
-- Add unique constraint to prevent duplicate assignments
ALTER TABLE user_module_assignments 
ADD CONSTRAINT unique_user_module_assignment 
UNIQUE (user_id, module_id);

-- Add updated_at columns with triggers for optimistic concurrency
ALTER TABLE modules ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE adaptive_ideas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE tweakable_questions ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create triggers for version increment on updates
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply version triggers
CREATE TRIGGER modules_version_trigger
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER adaptive_ideas_version_trigger
  BEFORE UPDATE ON adaptive_ideas
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();

CREATE TRIGGER tweakable_questions_version_trigger
  BEFORE UPDATE ON tweakable_questions
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();