-- Fix security warnings by updating auth configuration

-- 1. Fix OTP expiry time - Set to recommended 10 minutes (600 seconds)
UPDATE auth.config 
SET 
  otp_expiry = 600,
  password_min_length = 8,
  password_strength_check = true
WHERE instance_id = '00000000-0000-0000-0000-000000000000';

-- If the config table doesn't exist or needs initialization, create appropriate settings
INSERT INTO auth.config (instance_id, otp_expiry, password_min_length, password_strength_check)
VALUES ('00000000-0000-0000-0000-000000000000', 600, 8, true)
ON CONFLICT (instance_id) DO UPDATE SET
  otp_expiry = EXCLUDED.otp_expiry,
  password_min_length = EXCLUDED.password_min_length,
  password_strength_check = EXCLUDED.password_strength_check;