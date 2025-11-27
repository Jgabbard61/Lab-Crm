# Workflow Tracking Migration Instructions

**Date:** November 27, 2025  
**Purpose:** Add comprehensive workflow tracking from kit shipment to payment

---

## 🚨 CRITICAL: Run This Migration in Supabase

Before using the new workflow features, you **MUST** run the migration script in your Supabase SQL Editor.

### Step-by-Step Instructions:

#### 1. Open Supabase SQL Editor
- Go to your Supabase Dashboard: https://app.supabase.com
- Select your project
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

#### 2. Copy the Migration Script
- Open the file: `supabase/migration_20251127_workflow_tracking.sql`
- Copy the **entire contents** of the file

#### 3. Paste and Execute
- Paste the SQL into the SQL Editor
- Click "Run" (or press Ctrl+Enter)
- Wait for the success message: "Success. No rows returned"

#### 4. Verify the Migration
Run these verification queries:

```sql
-- Check new columns in tests table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tests' 
AND column_name IN (
  'kit_shipped_date', 
  'accessioning_status', 
  'sent_to_lab_date'
);

-- Check test_notes table exists
SELECT * FROM test_notes LIMIT 1;

-- Check test_notes RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'test_notes';
```

**Expected Results:**
- 3 rows showing the new columns
- test_notes table exists (even if empty)
- 4 RLS policies (INSERT, SELECT, UPDATE, DELETE)

---

## 📋 What This Migration Adds

### 1. **Kit Shipment & Logistics Fields**
- `kit_shipped_date` - When kit was shipped TO patient
- `kit_shipment_tracking` - FedEx tracking number (TO patient)
- `kit_return_tracking` - FedEx tracking number (FROM patient)
- `kit_received_date` - When kit was received back at lab
- `kit_shipment_status` - Status: Pending, Shipped, Delivered, Returned

### 2. **Accessioning/QC Fields**
- `accessioning_status` - QC Status: Pending, Accepted, Rejected
- `accessioning_date` - When sample was accessioned (QC completed)
- `accessioning_notes` - QC notes, rejection reasons (spilled, leaked, etc.)

### 3. **Lab Processing Fields**
- `sent_to_lab_date` - When sample was sent to reference laboratory
- `results_received_date` - When results were received from lab

### 4. **Test Notes Table**
New `test_notes` table for tracking priority comments:
- Billing issues
- Insurance requests
- Code corrections
- Any other important notes

**Features:**
- Priority ranking: High (!!urgent!!) or Low
- User tracking (who added the note)
- Timestamps (when note was created)

### 5. **Document Categories**
- Added "Requisitions" to document categories
- Categories: Results, EOBs, Denials, Payments, Insurance Correspondence, **Requisitions**

---

## 🎯 New Features in the CRM

### 1. **Enhanced Test Cards**
Each test now displays:
- 📦 **Shipping & Tracking** - Kit shipment details with FedEx tracking links
- ✅ **Accessioning/QC** - Sample acceptance/rejection with notes
- 🔬 **Lab Processing** - Lab submission and results tracking
- 💰 **Billing & Payment** - Complete financial breakdown
- 📝 **Notes & Comments** - Priority notes with user tracking

### 2. **Comprehensive Status Flow**
New test statuses:
1. Kit Shipped
2. Kit Returned
3. Accessioning
4. Accepted
5. Rejected
6. Sent to Lab
7. At Lab
8. Resulted
9. Ready for Bill
10. Billed - Pending
11. Billed - Confirmed
12. Paid in Full
13. Partial Payment
14. Denied

### 3. **FedEx Tracking Integration**
- Click tracking numbers to open FedEx tracking in new tab
- Track both shipment TO patient and return FROM patient

### 4. **Priority Notes System**
- **High Priority** - Red badge with !! urgent !!
- **Low Priority** - Gray badge
- Shows who added the note and when
- Perfect for:
  - Billing issues
  - Insurance requests
  - Medical records needed
  - Code corrections
  - Partial payment follow-ups

### 5. **Requisitions Category**
- New document category for req forms
- Upload scanned requisition forms
- Organized with other categories

---

## ⚙️ Workflow Dashboard (Coming Soon)

Visual pipeline showing counts at each stage:
```
Kit Shipped (5) → Returned (3) → Accessioning (2) → At Lab (7) → Resulted (12) → Billed (8) → Paid (15)
```

---

## 🔧 Troubleshooting

### Error: "column already exists"
**Cause:** Migration was already run  
**Solution:** This is safe to ignore. The migration uses `IF NOT EXISTS` clauses.

### Error: "permission denied"
**Cause:** Insufficient database permissions  
**Solution:** 
1. Ensure you're logged into Supabase as project owner
2. Try running migration from Supabase dashboard (not locally)
3. Contact Supabase support if issue persists

### Error: "relation test_notes does not exist" (in app)
**Cause:** Migration wasn't run yet  
**Solution:** Complete Steps 1-3 above

### Tracking buttons don't work
**Cause:** Invalid tracking numbers or network issue  
**Solution:** 
1. Verify tracking number is correct
2. Check if FedEx.com is accessible
3. Try opening tracking URL manually

---

## 📝 Next Steps After Migration

1. **✅ Migration Completed** - Run the SQL script
2. **🔄 Refresh Your App** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **➕ Add/Edit a Test** - Try the new fields
4. **📝 Add a Note** - Test the priority notes system
5. **📋 Upload a Requisition** - Use the new document category

---

## 💡 Usage Tips

### Quick Accessioning Workflow
1. Patient returns kit → Note "Kit Received" date
2. Open test → Go to Accessioning section
3. Click "Accepted" or "Rejected"
4. Add accessioning notes if needed (e.g., "Sample leaked")
5. Update status to "Sent to Lab" when shipped

### Priority Notes Best Practices
- **Use High Priority for:**
  - Urgent billing issues
  - Insurance requests with deadlines
  - Claims about to deny
  - Patient complaints

- **Use Low Priority for:**
  - General observations
  - Future follow-ups
  - Informational notes

### Tracking Numbers
- Always include full FedEx tracking number
- Format: 12-14 digits (e.g., 123456789012)
- Click to open FedEx tracking automatically

---

## 📞 Support

If you encounter issues:
1. Check this document for troubleshooting
2. Verify migration was run successfully
3. Check browser console for errors (F12)
4. Review Supabase logs for database errors

---

**Migration Script Location:**  
`/supabase/migration_20251127_workflow_tracking.sql`

**Build Status:** ✅ Tested and verified  
**Compatibility:** Works with existing data (backward compatible)
