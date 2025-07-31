-- Add English video URL column to modules table
ALTER TABLE public.modules 
ADD COLUMN english_video_url text;