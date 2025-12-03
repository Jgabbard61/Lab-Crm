-- Migration: Add Medical History Fields to Patients Table
-- Date: 2025-12-03
-- Description: Adds personal_history and family_history columns to patients table

-- Add personal_history column
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS personal_history TEXT;

-- Add family_history column
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS family_history TEXT;

-- Add comments for documentation
COMMENT ON COLUMN patients.personal_history IS 'Patient''s personal medical history';
COMMENT ON COLUMN patients.family_history IS 'Patient''s family medical history';

-- Verification query
-- Run this to confirm the columns were added:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' 
-- AND column_name IN ('personal_history', 'family_history');
