-- Migration: Add Workflow Tracking Fields
-- Date: November 27, 2025
-- Description: Adds comprehensive tracking for kit shipment, accessioning, lab processing, and notes

-- ============================================
-- PART 1: Extend tests table with tracking fields
-- ============================================

-- Kit Shipment & Logistics
ALTER TABLE tests ADD COLUMN IF NOT EXISTS kit_shipped_date DATE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS kit_shipment_tracking TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS kit_return_tracking TEXT;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS kit_received_date DATE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS kit_shipment_status TEXT DEFAULT 'Pending';

COMMENT ON COLUMN tests.kit_shipped_date IS 'Date kit was shipped TO patient';
COMMENT ON COLUMN tests.kit_shipment_tracking IS 'FedEx tracking number for kit shipped TO patient';
COMMENT ON COLUMN tests.kit_return_tracking IS 'FedEx tracking number for kit returned FROM patient';
COMMENT ON COLUMN tests.kit_received_date IS 'Date kit was received back at lab';
COMMENT ON COLUMN tests.kit_shipment_status IS 'Status: Pending, Shipped, Delivered, Returned';

-- Accessioning
ALTER TABLE tests ADD COLUMN IF NOT EXISTS accessioning_status TEXT DEFAULT 'Pending';
ALTER TABLE tests ADD COLUMN IF NOT EXISTS accessioning_date DATE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS accessioning_notes TEXT;

COMMENT ON COLUMN tests.accessioning_status IS 'QC Status: Pending, Accepted, Rejected';
COMMENT ON COLUMN tests.accessioning_date IS 'Date sample was accessioned (QC completed)';
COMMENT ON COLUMN tests.accessioning_notes IS 'QC notes, rejection reasons (spilled, leaked, incorrectly swabbed, etc.)';

-- Lab Processing
ALTER TABLE tests ADD COLUMN IF NOT EXISTS sent_to_lab_date DATE;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS results_received_date DATE;

COMMENT ON COLUMN tests.sent_to_lab_date IS 'Date sample was sent to reference laboratory';
COMMENT ON COLUMN tests.results_received_date IS 'Date results were received from reference laboratory';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tests_kit_received_date ON tests(kit_received_date);
CREATE INDEX IF NOT EXISTS idx_tests_accessioning_status ON tests(accessioning_status);
CREATE INDEX IF NOT EXISTS idx_tests_accessioning_date ON tests(accessioning_date);
CREATE INDEX IF NOT EXISTS idx_tests_sent_to_lab_date ON tests(sent_to_lab_date);
CREATE INDEX IF NOT EXISTS idx_tests_results_received_date ON tests(results_received_date);

-- ============================================
-- PART 2: Create test_notes table for priority comments
-- ============================================

CREATE TABLE IF NOT EXISTS test_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Low' CHECK (priority IN ('High', 'Low')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

COMMENT ON TABLE test_notes IS 'Priority notes/comments for tests (billing issues, insurance requests, etc.)';
COMMENT ON COLUMN test_notes.priority IS 'Priority level: High (!!urgent!!) or Low';
COMMENT ON COLUMN test_notes.created_by IS 'Username of person who added the note';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_notes_test_id ON test_notes(test_id);
CREATE INDEX IF NOT EXISTS idx_test_notes_patient_id ON test_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_notes_priority ON test_notes(priority);
CREATE INDEX IF NOT EXISTS idx_test_notes_created_at ON test_notes(created_at DESC);

-- Enable RLS for test_notes
ALTER TABLE test_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to insert notes" ON test_notes;
DROP POLICY IF EXISTS "Allow authenticated users to select notes" ON test_notes;
DROP POLICY IF EXISTS "Allow authenticated users to update notes" ON test_notes;
DROP POLICY IF EXISTS "Allow authenticated users to delete notes" ON test_notes;

-- Create RLS policies for test_notes
CREATE POLICY "Allow authenticated users to insert notes"
  ON test_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select notes"
  ON test_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update notes"
  ON test_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete notes"
  ON test_notes FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- PART 3: Add Requisitions to document categories
-- ============================================
-- Note: Document category is a TEXT field, not an enum
-- The application will handle the category validation
-- Just adding a comment for documentation

COMMENT ON COLUMN documents.document_category IS 'Category: Results, EOBs, Denials, Payments, Insurance Correspondence, Requisitions';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked:

-- Check new columns in tests table
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'tests' 
-- AND column_name IN ('kit_shipped_date', 'accessioning_status', 'sent_to_lab_date');

-- Check test_notes table
-- SELECT * FROM test_notes LIMIT 1;

-- Check test_notes RLS policies
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'test_notes';
