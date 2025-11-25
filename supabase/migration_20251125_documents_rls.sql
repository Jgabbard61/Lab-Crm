-- Migration: Add RLS Policies for Documents Table
-- Date: 2025-11-25
-- Description: Enable Row Level Security and create policies for authenticated users

-- First, enable RLS on the documents table if not already enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON documents;

-- Policy 1: Allow authenticated users to INSERT documents
CREATE POLICY "Authenticated users can insert documents"
ON documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 2: Allow authenticated users to SELECT (view) documents
CREATE POLICY "Authenticated users can view documents"
ON documents
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Allow authenticated users to UPDATE documents
CREATE POLICY "Authenticated users can update documents"
ON documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to DELETE documents
CREATE POLICY "Authenticated users can delete documents"
ON documents
FOR DELETE
TO authenticated
USING (true);

-- Verify RLS is enabled
COMMENT ON TABLE documents IS 'RLS enabled with full access for authenticated users';
