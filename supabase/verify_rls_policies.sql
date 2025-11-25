-- Run this in Supabase SQL Editor to verify RLS policies are correctly set up

-- 1. Check if RLS is enabled on documents table
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'documents';

-- Expected result: rowsecurity = true

-- 2. List all policies on documents table
SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    roles as "Roles",
    qual as "USING Expression",
    with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'documents'
ORDER BY cmd;

-- Expected result: 4 policies
-- - Authenticated users can insert documents (INSERT)
-- - Authenticated users can view documents (SELECT)
-- - Authenticated users can update documents (UPDATE)
-- - Authenticated users can delete documents (DELETE)

-- 3. Verify authenticated role exists
SELECT rolname 
FROM pg_roles 
WHERE rolname = 'authenticated';

-- Expected result: Should show 'authenticated' role
