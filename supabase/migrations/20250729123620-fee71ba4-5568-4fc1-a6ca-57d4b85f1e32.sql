-- Add PDF report URL column to modules table
ALTER TABLE public.modules 
ADD COLUMN IF NOT EXISTS pdf_report_url text;

-- Create storage buckets for reports and screenshots if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for reports bucket
CREATE POLICY IF NOT EXISTS "Reports are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'reports');

CREATE POLICY IF NOT EXISTS "Admins can upload reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'reports');

-- Create policies for screenshots bucket
CREATE POLICY IF NOT EXISTS "Screenshots are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'screenshots');

CREATE POLICY IF NOT EXISTS "Admins can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'screenshots');