-- Create tweakable_questions table
CREATE TABLE public.tweakable_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tweakable_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for tweakable_questions
CREATE POLICY "Authenticated users can view active questions"
ON public.tweakable_questions
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage tweakable questions"
ON public.tweakable_questions
FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- Create index for performance
CREATE INDEX idx_tweakable_questions_active ON public.tweakable_questions(is_active);
CREATE INDEX idx_tweakable_questions_category ON public.tweakable_questions(category);

-- Update tweak_requests table to reference tweakable_questions instead of modules
ALTER TABLE public.tweak_requests 
DROP COLUMN IF EXISTS question_id;

ALTER TABLE public.tweak_requests 
ADD COLUMN question_id UUID REFERENCES public.tweakable_questions(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tweakable_questions_updated_at
BEFORE UPDATE ON public.tweakable_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample tweakable questions
INSERT INTO public.tweakable_questions (title, category) VALUES
('Why are insurance premiums so high?', 'Insurance'),
('How can I reduce my coverage costs?', 'Insurance'), 
('What factors affect my premium rates?', 'Insurance');