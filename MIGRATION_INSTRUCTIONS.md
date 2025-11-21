# Database Migration Instructions

## IMPORTANT: Run This Migration in Supabase SQL Editor

Before the new features will work, you **MUST** run the database migration in your Supabase dashboard.

### Steps:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **patient-crm**
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New Query"**
5. Open the file: `supabase/migration_20251121_enhancements.sql`
6. Copy the **entire contents** of the file
7. Paste it into the SQL Editor
8. Click **"Run"** (or press Ctrl/Cmd + Enter)
9. Wait for the success message

### What This Migration Does:

1. **Adds `status` field to patients table**
   - Tracks claim disposition: "Claim Pending", "Billed", "Claim Received", "Paid in Full", "Partial Payment", "Denied"
   - Defaults to "Claim Pending" for new patients

2. **Renames `clinic_facility` to `reference_laboratory`**
   - More accurate terminology for your lab workflow
   - Old column is renamed, so existing data is preserved

3. **Adds `date_reported` field to tests table**
   - Separate from `date_of_service` (collection date)
   - Tracks when the lab completed and reported the test results

4. **Adds `document_category` field to documents table**
   - Prepares for organized document folders
   - Categories: Results, EOBs, Denials, Payments, Insurance Correspondence

### After Running the Migration:

✅ You can now:
- Set and edit patient claim status
- Edit existing tests (previously you could only add them)
- Track both collection date and report date for tests
- Use the new Reference Laboratory field
- See status badges on dashboard and patient profiles

### If You Encounter Errors:

- **Error: "column already exists"** → Migration was already run, you're good!
- **Error: "permission denied"** → Make sure you're logged in as the project owner
- **Other errors** → Check that your database schema matches the original setup

---

## Next Steps

After running the migration, the new features will be immediately available in your deployed app at:
https://lab-crm-rho.vercel.app

No need to redeploy - Vercel automatically deployed the latest changes!
