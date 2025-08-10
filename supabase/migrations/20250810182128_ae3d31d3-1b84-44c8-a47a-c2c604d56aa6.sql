-- Create module_adaptations table for storing adapted versions of modules
CREATE TABLE public.module_adaptations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  adapted_content TEXT NOT NULL,
  adaptation_type TEXT NOT NULL CHECK (adaptation_type IN ('personalized', 'contextual', 'follow-up')),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.module_adaptations ENABLE ROW LEVEL SECURITY;

-- Create policies for module_adaptations
CREATE POLICY "Admins can manage all adaptations" 
ON public.module_adaptations 
FOR ALL 
USING (is_admin_user(auth.uid()));

CREATE POLICY "Users can view adaptations they created" 
ON public.module_adaptations 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create adaptations" 
ON public.module_adaptations 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their adaptations" 
ON public.module_adaptations 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_module_adaptations_updated_at
BEFORE UPDATE ON public.module_adaptations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();