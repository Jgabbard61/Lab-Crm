# Excel Import Field Mapping Fix

## Issue
The Excel import was failing with RLS policy errors because several patient fields referenced in the import code were missing from the database schema:
- `ethnicity`
- `jg_comments` (JG-specific comments)
- `mr` (Medical Record field)

## What Was Fixed

### 1. Database Migration Created
Created `supabase/migration_20251203_missing_patient_fields.sql` to add the missing columns to the `patients` table.

### 2. TypeScript Types Updated
Updated the `Patient` interface in `/lib/supabase/client.ts` to include:
- `mr?: string` - Medical Record reference field

(Note: `ethnicity` and `jg_comments` were already in the interface)

### 3. Import Logic Updated
Updated `/api/import/execute/route.ts` to include the `mr` field in the `patientData` object that gets saved during import.

## Action Required: Run Database Migration

You need to run the migration in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration
Copy and paste the following SQL into the editor and click **Run**:

```sql
-- Add missing patient fields
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS jg_comments TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mr TEXT;

-- Add comments for documentation
COMMENT ON COLUMN patients.ethnicity IS 'Patient ethnicity/race';
COMMENT ON COLUMN patients.jg_comments IS 'JG-specific comments and notes';
COMMENT ON COLUMN patients.mr IS 'Medical record reference field';

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_patients_ethnicity ON patients(ethnicity);
```

### Step 3: Verify the Migration
Run this verification query to confirm all fields were added:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
  AND column_name IN ('ethnicity', 'jg_comments', 'mr', 'city', 'state', 'zip', 'phone')
ORDER BY column_name;
```

**Expected Result:** You should see all 7 fields listed with `data_type = 'text'` and `is_nullable = 'YES'`.

## Complete Excel Header Mapping

After running the migration, the import system will now support ALL of the following Excel headers:

### Patient Information
- First Name / First
- Last Name / Last
- Date of Birth / DOB
- Gender
- **Ethnicity** ✓ (newly added)
- Phone
- Address
- City
- State
- Zip
- Fax

### Medical Information
- ICD-10 Code / ICD Codes / ICD10
- Personal History
- Family History
- **MR** ✓ (newly added)

### Provider/Facility
- Ref Physician / Ref Provider
- NPI# / NPI
- Clinic/Facility/Ref Lab
- Reference Lab
- Sales Rep

### Insurance
- Insurance / Insurance Name / Primary Insurance Name
- Policy / Member ID

### Test Information
- Accession
- Test/Modality / Test Name
- Claim Status / Test Result Status
- DOS(Collection) / DOS

### Shipping & Tracking
- Kit Shipment Tracking ID / Ship To Tracking
- Pt Kit Return Tracking ID / Ship From Tracking
- Kit Received Date
- Entered Date (maps to Kit Shipped Date)
- Kit Return Status

### Comments & Notes
- Comments / Notes / ChartNotes / PA Notes / FedEx Notes
- **JG Comments** ✓ (newly added)
- Comments / Rejection Reason

### Dates
- Result-In Date
- Result Fax Date
- Billed Date
- Check/EFT Date
- Payment Date

### Billing
- Claim
- Charges
- Paid
- Ded/Coins
- Patient Responsibility
- Check/EFT#
- Payment #
- Deductible
- Correction/Requests

## Troubleshooting

### Error: "column already exists"
This is safe to ignore - it means the field was already in your database.

### Error: "permission denied"
Make sure you're logged into Supabase as the project owner or have admin permissions.

### Import Still Failing After Migration
1. Refresh your browser to clear any cached API responses
2. Try the import again
3. Check the browser console (F12) for any new error messages

## Next Steps

Once the migration is complete:
1. The deployed app will immediately work with the new fields
2. You can import Excel files with any combination of the headers listed above
3. All patient data fields will be properly mapped and stored

---

**Note:** This migration is **safe** and **idempotent**. Running it multiple times will not cause any issues or data loss.
