-- Create adaptive_ideas table linked to modules
CREATE TABLE public.adaptive_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on adaptive_ideas
ALTER TABLE public.adaptive_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for adaptive_ideas
CREATE POLICY "Admins can manage adaptive ideas" 
ON public.adaptive_ideas 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Users can view ideas from assigned modules" 
ON public.adaptive_ideas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_module_assignments 
    WHERE user_id = auth.uid() AND module_id = adaptive_ideas.module_id
  )
);

-- Add module_id to tweakable_questions to link them to specific modules
ALTER TABLE public.tweakable_questions 
ADD COLUMN module_id UUID;

-- Update tweakable_questions RLS policies to be module-aware
DROP POLICY IF EXISTS "Authenticated users can view active questions" ON public.tweakable_questions;

CREATE POLICY "Users can view questions from assigned modules" 
ON public.tweakable_questions 
FOR SELECT 
USING (
  is_active = true AND (
    module_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.user_module_assignments 
      WHERE user_id = auth.uid() AND module_id = tweakable_questions.module_id
    )
  )
);

-- Create trigger for adaptive_ideas updated_at
CREATE TRIGGER update_adaptive_ideas_updated_at
BEFORE UPDATE ON public.adaptive_ideas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_adaptive_ideas_module_id ON public.adaptive_ideas(module_id);
CREATE INDEX idx_tweakable_questions_module_id ON public.tweakable_questions(module_id) WHERE module_id IS NOT NULL;