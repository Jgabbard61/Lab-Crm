-- Migration: Add Missing Patient Fields
-- Date: 2025-12-03
-- Description: Add all patient fields that are referenced in import code but may not exist in database

-- Add ethnicity column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ethnicity TEXT;

-- Add JG comments column (separate from general comments)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS jg_comments TEXT;

-- Add MR column (medical record related field from import mapping)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mr TEXT;

-- Add comments for documentation
COMMENT ON COLUMN patients.ethnicity IS 'Patient ethnicity/race';
COMMENT ON COLUMN patients.jg_comments IS 'JG-specific comments and notes';
COMMENT ON COLUMN patients.mr IS 'Medical record reference field';

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_patients_ethnicity ON patients(ethnicity);

-- Verification query (run this to confirm migration worked)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' 
--   AND column_name IN ('ethnicity', 'jg_comments', 'mr')
-- ORDER BY column_name;
