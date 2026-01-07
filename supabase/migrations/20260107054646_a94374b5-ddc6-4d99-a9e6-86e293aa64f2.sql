
-- Clean up orphaned records (only affects 11 test records, not production data)
DELETE FROM tweakable_questions WHERE module_id IS NOT NULL AND module_id NOT IN (SELECT id FROM modules);
DELETE FROM adaptive_ideas WHERE module_id IS NOT NULL AND module_id NOT IN (SELECT id FROM modules);

-- Drop existing foreign key constraints
ALTER TABLE public.data_uploads DROP CONSTRAINT IF EXISTS data_uploads_module_id_fkey;
ALTER TABLE public.data_uploads DROP CONSTRAINT IF EXISTS fk_data_uploads_module;

ALTER TABLE public.user_module_assignments DROP CONSTRAINT IF EXISTS user_module_assignments_module_id_fkey;
ALTER TABLE public.user_module_assignments DROP CONSTRAINT IF EXISTS fk_user_module_assignments_module_id;
ALTER TABLE public.user_module_assignments DROP CONSTRAINT IF EXISTS fk_user_module_assignments_module;

ALTER TABLE public.tweakable_questions DROP CONSTRAINT IF EXISTS tweakable_questions_module_id_fkey;
ALTER TABLE public.tweakable_questions DROP CONSTRAINT IF EXISTS fk_tweakable_questions_module;

ALTER TABLE public.tweak_requests DROP CONSTRAINT IF EXISTS tweak_requests_module_id_fkey;
ALTER TABLE public.tweak_requests DROP CONSTRAINT IF EXISTS fk_tweak_requests_module;

ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_module_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS fk_requests_module;

ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_module_id_fkey;
ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS fk_recommendations_module;

ALTER TABLE public.adaptive_ideas DROP CONSTRAINT IF EXISTS adaptive_ideas_module_id_fkey;
ALTER TABLE public.adaptive_ideas DROP CONSTRAINT IF EXISTS fk_adaptive_ideas_module;

-- Add foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.data_uploads
ADD CONSTRAINT fk_data_uploads_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.user_module_assignments
ADD CONSTRAINT fk_user_module_assignments_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.tweakable_questions
ADD CONSTRAINT fk_tweakable_questions_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.tweak_requests
ADD CONSTRAINT fk_tweak_requests_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.requests
ADD CONSTRAINT fk_requests_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.recommendations
ADD CONSTRAINT fk_recommendations_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.adaptive_ideas
ADD CONSTRAINT fk_adaptive_ideas_module
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
