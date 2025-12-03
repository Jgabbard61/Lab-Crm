# Fix Excel Import RLS Error

## Problem
When trying to import patient data from Excel, you're getting these errors:
```
Row 2: new row violates row-level security policy for table "patients"
Row 3: new row violates row-level security policy for table "patients"
...
```

## Solution
You need to enable Row Level Security (RLS) policies on the `patients` and `tests` tables to allow authenticated users to insert, update, and delete records.

## Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query** button

### Step 2: Run the Migration Script
1. Open the file: `supabase/migration_20251203_patients_tests_rls.sql`
2. Copy **ALL** the content from that file
3. Paste it into the SQL Editor
4. Click **Run** button (or press Cmd+Enter / Ctrl+Enter)

### Step 3: Verify the Migration
After running the migration, verify it worked by running this query in the SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('patients', 'tests', 'activity_logs');

-- Check policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('patients', 'tests', 'activity_logs') 
ORDER BY tablename, cmd;
```

**Expected Result:**
- All three tables should show `rowsecurity = true`
- You should see 4 policies for `patients` (INSERT, SELECT, UPDATE, DELETE)
- You should see 4 policies for `tests` (INSERT, SELECT, UPDATE, DELETE)
- You should see 2 policies for `activity_logs` (INSERT, SELECT)

### Step 4: Test the Import
1. Go back to your CRM application
2. Navigate to the **Import** page
3. Try importing your Excel file again
4. The import should now work without RLS errors!

## What This Migration Does

This migration enables Row Level Security and creates policies that allow authenticated users to:

### For `patients` table:
- ✅ INSERT new patient records (needed for Excel import)
- ✅ SELECT/view existing patients
- ✅ UPDATE patient information
- ✅ DELETE patient records

### For `tests` table:
- ✅ INSERT new test records (needed for Excel import)
- ✅ SELECT/view existing tests
- ✅ UPDATE test information
- ✅ DELETE test records

### For `activity_logs` table:
- ✅ INSERT activity log entries
- ✅ SELECT/view activity logs

## Troubleshooting

### Error: "policy already exists"
This means you've already run this migration or a similar one. You can safely ignore this error, or modify the migration to only create the missing policies.

### Error: "permission denied"
Make sure you're logged in as the Supabase project owner or have admin access.

### Import still fails after migration
1. Make sure you're logged into the CRM app (check the top right corner)
2. Try logging out and logging back in
3. Clear your browser cache
4. Check the browser console for additional error messages

### Error: "duplicate key value violates unique constraint"
This means a patient with the same Last Name + Date of Birth already exists. The import will skip these rows automatically.

## Important Notes

- ✅ **This migration is safe** - it only adds security policies, it doesn't modify or delete any data
- ✅ **Run it only once** - if you run it multiple times, you'll get "policy already exists" errors (which are harmless)
- ✅ **Immediate effect** - changes take effect immediately, no app redeployment needed
- ✅ **Required for Excel import** - without these policies, you won't be able to import patients from Excel

## Next Steps After Migration

1. ✅ Test patient import functionality
2. ✅ Verify that existing patients are still visible
3. ✅ Try creating a new patient manually to confirm everything works
4. ✅ Check that activity logs are being recorded properly
