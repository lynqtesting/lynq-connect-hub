-- Add category column to modules table
ALTER TABLE modules ADD COLUMN category text;

-- Create table for recommendation files
CREATE TABLE recommendation_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id uuid REFERENCES recommendations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on recommendation_files
ALTER TABLE recommendation_files ENABLE ROW LEVEL SECURITY;

-- Create policies for recommendation_files
CREATE POLICY "Users can view their recommendation files" 
ON recommendation_files 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM recommendations 
    WHERE recommendations.id = recommendation_files.recommendation_id 
    AND recommendations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their recommendation files" 
ON recommendation_files 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recommendations 
    WHERE recommendations.id = recommendation_files.recommendation_id 
    AND recommendations.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all recommendation files" 
ON recommendation_files 
FOR ALL 
USING (is_admin_user(auth.uid()));

-- Create storage bucket for recommendation files
INSERT INTO storage.buckets (id, name, public) VALUES ('recommendation-files', 'recommendation-files', false);

-- Create storage policies for recommendation files
CREATE POLICY "Users can upload their recommendation files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'recommendation-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their recommendation files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'recommendation-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage all recommendation files" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'recommendation-files' 
  AND is_admin_user(auth.uid())
);