-- Create data_uploads table for admin file uploads
CREATE TABLE IF NOT EXISTS public.data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_type TEXT NOT NULL CHECK (file_type IN ('response_csv', 'deduction_json')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  processed BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;

-- Only admins can manage uploads
CREATE POLICY "Admins can manage all uploads"
  ON public.data_uploads
  FOR ALL
  USING (is_admin_user(auth.uid()))
  WITH CHECK (is_admin_user(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_data_uploads_type ON public.data_uploads(file_type);
CREATE INDEX idx_data_uploads_created ON public.data_uploads(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_data_uploads_updated_at
  BEFORE UPDATE ON public.data_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();