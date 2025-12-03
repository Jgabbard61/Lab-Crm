-- Migration: Add Address Component Fields
-- Date: 2025-12-03
-- Description: Split address into separate components (city, state, zip)

-- Add city, state, zip columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS zip TEXT;

-- Add comments for documentation
COMMENT ON COLUMN patients.city IS 'Patient city';
COMMENT ON COLUMN patients.state IS 'Patient state (e.g., CA, NY, TX)';
COMMENT ON COLUMN patients.zip IS 'Patient ZIP/postal code';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_patients_city ON patients(city);
CREATE INDEX IF NOT EXISTS idx_patients_state ON patients(state);
CREATE INDEX IF NOT EXISTS idx_patients_zip ON patients(zip);

-- Verification query (run this to confirm migration worked)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' 
--   AND column_name IN ('city', 'state', 'zip')
-- ORDER BY column_name;
