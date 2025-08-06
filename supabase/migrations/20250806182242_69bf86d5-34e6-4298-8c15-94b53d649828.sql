-- Add new columns for audio files and thematic analysis screenshots
ALTER TABLE modules 
ADD COLUMN english_audio_url TEXT,
ADD COLUMN confusion_analysis_url TEXT,
ADD COLUMN followup_questions_url TEXT;