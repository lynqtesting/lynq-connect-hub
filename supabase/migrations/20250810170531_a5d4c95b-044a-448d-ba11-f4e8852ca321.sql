-- 1) Extend modules with analytics JSON and summary text
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS kpis JSONB,
  ADD COLUMN IF NOT EXISTS trend JSONB,
  ADD COLUMN IF NOT EXISTS confusion_data JSONB,
  ADD COLUMN IF NOT EXISTS perception JSONB,
  ADD COLUMN IF NOT EXISTS objections JSONB,
  ADD COLUMN IF NOT EXISTS summary_text TEXT;

-- 2) Create tweak_requests table to capture client tweak uploads/brochures
CREATE TABLE IF NOT EXISTS public.tweak_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT,
  notes TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tweak_requests ENABLE ROW LEVEL SECURITY;

-- Policies: admins manage all (using existing helper), users manage/view their own
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tweak_requests' AND policyname = 'Admins can manage tweak requests'
  ) THEN
    CREATE POLICY "Admins can manage tweak requests"
    ON public.tweak_requests
    FOR ALL
    USING (is_admin_user(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tweak_requests' AND policyname = 'Users can insert their tweak requests'
  ) THEN
    CREATE POLICY "Users can insert their tweak requests"
    ON public.tweak_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tweak_requests' AND policyname = 'Users can view their tweak requests'
  ) THEN
    CREATE POLICY "Users can view their tweak requests"
    ON public.tweak_requests
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3) Storage bucket for tweak brochures/files
INSERT INTO storage.buckets (id, name, public)
VALUES ('tweak-uploads', 'tweak-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tweak-uploads bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can manage tweak files'
  ) THEN
    CREATE POLICY "Admins can manage tweak files"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'tweak-uploads' AND is_admin_user(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload their own tweak files'
  ) THEN
    CREATE POLICY "Users can upload their own tweak files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'tweak-uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view their own tweak files'
  ) THEN
    CREATE POLICY "Users can view their own tweak files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'tweak-uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;