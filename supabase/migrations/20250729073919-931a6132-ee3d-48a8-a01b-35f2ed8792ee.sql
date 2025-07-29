-- Create modules table for training modules
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT, -- 'video', 'document', 'image'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user module assignments table
CREATE TABLE public.user_module_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, module_id)
);

-- Create requests table for user requests
CREATE TABLE public.requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.modules(id),
  request_type TEXT NOT NULL, -- 'new', 'adapt'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.modules(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('modules', 'modules', true),
  ('screenshots', 'screenshots', true);

-- Enable Row Level Security
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for modules (admins can manage, users can view)
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL USING (true);

-- Create policies for assignments
CREATE POLICY "Users can view their assignments" ON public.user_module_assignments 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage assignments" ON public.user_module_assignments 
  FOR ALL USING (true);

-- Create policies for requests
CREATE POLICY "Users can view their requests" ON public.requests 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create requests" ON public.requests 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all requests" ON public.requests 
  FOR SELECT USING (true);
CREATE POLICY "Admins can update requests" ON public.requests 
  FOR UPDATE USING (true);

-- Create policies for recommendations
CREATE POLICY "Users can view their recommendations" ON public.recommendations 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage recommendations" ON public.recommendations 
  FOR ALL USING (true);

-- Create storage policies
CREATE POLICY "Anyone can view module files" ON storage.objects 
  FOR SELECT USING (bucket_id = 'modules');
CREATE POLICY "Admins can upload module files" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'modules');

CREATE POLICY "Anyone can view screenshots" ON storage.objects 
  FOR SELECT USING (bucket_id = 'screenshots');
CREATE POLICY "Anyone can upload screenshots" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'screenshots');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();