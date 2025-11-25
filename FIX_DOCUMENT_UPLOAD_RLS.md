# 🚨 FIX REQUIRED: Document Upload RLS Policy Error

## The Problem

You're getting this error when trying to upload documents:
```
Error: new row violates row security level
```

**Root Cause:** Your Supabase database has Row Level Security (RLS) enabled on the `documents` table, but no policies are defined to allow authenticated users to insert rows. This blocks all document uploads.

---

## The Solution (5 Minutes)

You need to run a SQL migration in your Supabase dashboard to add the required RLS policies.

### Step-by-Step Instructions:

#### 1. Open the Migration File
- The migration file is located at: `supabase/migration_20251125_documents_rls.sql`
- Open this file and copy ALL of its contents

#### 2. Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your `patient-crm` project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button

#### 3. Run the Migration
1. Paste the entire contents of `migration_20251125_documents_rls.sql` into the query editor
2. Click the **Run** button (or press Cmd/Ctrl + Enter)
3. You should see: `Success. No rows returned`

#### 4. Verify the Fix
1. Go back to your Patient CRM application
2. Navigate to any patient profile
3. Go to the Documents tab
4. Click "Upload Document"
5. Select a file and click "Upload"
6. **Result:** Upload should now work! ✅

---

## What This Migration Does

The migration creates 4 Row Level Security policies on the `documents` table:

1. **INSERT Policy** - Allows authenticated users to upload documents
2. **SELECT Policy** - Allows authenticated users to view documents
3. **UPDATE Policy** - Allows authenticated users to edit document metadata
4. **DELETE Policy** - Allows authenticated users to delete documents

**Security:** All policies require authentication - anonymous users cannot access documents.

---

## Troubleshooting

### Error: "policy already exists"
✅ **This is OK!** It means the policies are already in place. You can ignore this error.

### Error: "permission denied for table documents"
❌ **Solution:** Make sure you're logged into Supabase as the project owner (the account that created the project).

### Error: "relation 'documents' does not exist"
❌ **Solution:** You need to run the main schema first. Go to SUPABASE_SETUP.md and follow Steps 1-3 to create the database schema.

### Still Not Working?
If document uploads still fail after running the migration:

1. **Check RLS is enabled:**
   - Run this in SQL Editor:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'documents';
   ```
   - Should return: `rowsecurity = true`

2. **Verify policies exist:**
   - Run this in SQL Editor:
   ```sql
   SELECT policyname, cmd, roles, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'documents';
   ```
   - Should show 4 policies for INSERT, SELECT, UPDATE, DELETE

3. **Check authentication:**
   - Make sure you're logged into the CRM
   - Try logging out and logging back in
   - Check browser console (F12) for authentication errors

---

## Quick Reference

### Migration File Location:
```
supabase/migration_20251125_documents_rls.sql
```

### Where to Run It:
```
Supabase Dashboard → SQL Editor → New Query → Paste → Run
```

### Expected Result:
```
Success. No rows returned
```

### Test Upload:
```
Patient Profile → Documents Tab → Upload Document → Select File → Upload
```

---

## Need Help?

If you're still experiencing issues after following these steps:

1. Check the browser console (F12 → Console tab) for detailed error messages
2. Look at the Network tab to see the exact API response
3. Verify your Supabase credentials in `.env` file are correct
4. Make sure the `patient-documents` storage bucket exists and has policies set

---

## Summary

✅ **Run the migration:** `supabase/migration_20251125_documents_rls.sql`  
✅ **Where:** Supabase Dashboard → SQL Editor  
✅ **Result:** Document uploads will work  
✅ **Time:** Less than 5 minutes  

**This is a one-time fix. Once applied, document uploads will work permanently.**
