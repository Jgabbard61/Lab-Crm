-- Comprehensive RLS Verification Script
-- Run this in Supabase SQL Editor to verify all RLS policies are properly configured

-- ============================================
-- 1. CHECK WHICH TABLES HAVE RLS ENABLED
-- ============================================
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'tests', 'documents', 'activity_logs', 'test_notes')
ORDER BY tablename;

-- Expected: All tables should show 'true' for RLS Enabled

-- ============================================
-- 2. LIST ALL RLS POLICIES
-- ============================================
SELECT 
  tablename as "Table",
  policyname as "Policy Name",
  cmd as "Operation",
  roles as "Role"
FROM pg_policies 
WHERE tablename IN ('patients', 'tests', 'documents', 'activity_logs', 'test_notes')
ORDER BY tablename, cmd;

-- Expected counts:
-- patients: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- tests: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- documents: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- activity_logs: 2 policies (INSERT, SELECT)
-- test_notes: 4 policies (INSERT, SELECT, UPDATE, DELETE)

-- ============================================
-- 3. COUNT POLICIES PER TABLE
-- ============================================
SELECT 
  tablename as "Table",
  COUNT(*) as "Number of Policies"
FROM pg_policies 
WHERE tablename IN ('patients', 'tests', 'documents', 'activity_logs', 'test_notes')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 4. CHECK IF 'authenticated' ROLE EXISTS
-- ============================================
SELECT rolname 
FROM pg_roles 
WHERE rolname = 'authenticated';

-- Expected: Should return one row with 'authenticated'

-- ============================================
-- 5. DETAILED POLICY INFORMATION
-- ============================================
SELECT 
  schemaname as "Schema",
  tablename as "Table",
  policyname as "Policy Name",
  permissive as "Permissive",
  roles as "Roles",
  cmd as "Command",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename IN ('patients', 'tests', 'documents', 'activity_logs', 'test_notes')
ORDER BY tablename, cmd;
