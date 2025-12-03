-- Migration: Enable RLS policies for patients and tests tables
-- Purpose: Allow authenticated users to insert/update/delete patient and test records
-- Date: 2025-12-03

-- ============================================
-- PATIENTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to view patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to update patients" ON patients;
DROP POLICY IF EXISTS "Allow authenticated users to delete patients" ON patients;

-- Create INSERT policy for patients
CREATE POLICY "Allow authenticated users to insert patients"
  ON patients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create SELECT policy for patients
CREATE POLICY "Allow authenticated users to view patients"
  ON patients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policy for patients
CREATE POLICY "Allow authenticated users to update patients"
  ON patients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create DELETE policy for patients
CREATE POLICY "Allow authenticated users to delete patients"
  ON patients
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- TESTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on tests table
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to insert tests" ON tests;
DROP POLICY IF EXISTS "Allow authenticated users to view tests" ON tests;
DROP POLICY IF EXISTS "Allow authenticated users to update tests" ON tests;
DROP POLICY IF EXISTS "Allow authenticated users to delete tests" ON tests;

-- Create INSERT policy for tests
CREATE POLICY "Allow authenticated users to insert tests"
  ON tests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create SELECT policy for tests
CREATE POLICY "Allow authenticated users to view tests"
  ON tests
  FOR SELECT
  TO authenticated
  USING (true);

-- Create UPDATE policy for tests
CREATE POLICY "Allow authenticated users to update tests"
  ON tests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create DELETE policy for tests
CREATE POLICY "Allow authenticated users to delete tests"
  ON tests
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- ACTIVITY_LOGS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on activity_logs table
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to insert activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow authenticated users to view activity_logs" ON activity_logs;

-- Create INSERT policy for activity_logs
CREATE POLICY "Allow authenticated users to insert activity_logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create SELECT policy for activity_logs
CREATE POLICY "Allow authenticated users to view activity_logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries after migration to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('patients', 'tests', 'activity_logs');
-- SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE tablename IN ('patients', 'tests', 'activity_logs') ORDER BY tablename, cmd;
