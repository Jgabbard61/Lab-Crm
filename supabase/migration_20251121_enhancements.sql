
-- Migration: Add Patient Status, Date Reported, Reference Laboratory, and Document Categories
-- Date: 2025-11-21
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Add status field to patients table
-- =====================================================
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Claim Pending';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);

-- Add comment to explain valid statuses
COMMENT ON COLUMN patients.status IS 'Patient claim status: Claim Pending, Billed, Claim Received, Paid in Full, Partial Payment, Denied';

-- =====================================================
-- 2. Rename clinic_facility to reference_laboratory
-- =====================================================
ALTER TABLE patients 
RENAME COLUMN clinic_facility TO reference_laboratory;

-- =====================================================
-- 3. Add date_reported field to tests table
-- =====================================================
ALTER TABLE tests 
ADD COLUMN IF NOT EXISTS date_reported DATE;

-- Add index for filtering by date_reported
CREATE INDEX IF NOT EXISTS idx_tests_date_reported ON tests(date_reported);

-- Add comment to explain the field
COMMENT ON COLUMN tests.date_reported IS 'Date when the lab completed and reported the test results';

-- =====================================================
-- 4. Add document_category field to documents table
-- =====================================================
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_category TEXT DEFAULT 'Results';

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);

-- Add comment to explain valid categories
COMMENT ON COLUMN documents.document_category IS 'Document category: Results, EOBs, Denials, Payments, Insurance Correspondence';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database Migration Completed Successfully!';
    RAISE NOTICE '📊 Added: status to patients, date_reported to tests, renamed clinic_facility to reference_laboratory';
    RAISE NOTICE '📁 Added: document_category to documents table';
    RAISE NOTICE '🔍 Created indexes for better query performance';
END $$;
