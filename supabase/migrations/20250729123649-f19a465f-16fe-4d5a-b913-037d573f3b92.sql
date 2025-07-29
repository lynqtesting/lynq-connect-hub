-- Add PDF report URL column to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS pdf_report_url text;

-- Create storage buckets for reports if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for reports bucket (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Reports are publicly accessible" ON storage.objects;
CREATE POLICY "Reports are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reports');

DROP POLICY IF EXISTS "Admins can upload reports" ON storage.objects;
CREATE POLICY "Admins can upload reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reports');

-- Create policies for screenshots bucket (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Screenshots are publicly accessible" ON storage.objects;
CREATE POLICY "Screenshots are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'screenshots');

DROP POLICY IF EXISTS "Admins can upload screenshots" ON storage.objects;
CREATE POLICY "Admins can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'screenshots');