
# Supabase Setup Instructions for Patient CRM

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project Name: `patient-crm` (or your choice)
   - Database Password: (generate a strong password and save it)
   - Region: Choose closest to your users
5. Click "Create new project" and wait for setup to complete

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for `.env` file):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql` (see below)
4. Click "Run" to execute the schema

## Step 4: Run Database Migrations (CRITICAL for Document Upload)

**IMPORTANT**: You must run these migrations for document upload to work!

### Migration 1: Schema Enhancements (if not already run)
1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `supabase/migration_20251121_enhancements.sql`
4. Click "Run" to execute

### Migration 2: Documents Table RLS Policies (REQUIRED)
1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents of `supabase/migration_20251125_documents_rls.sql`
4. Click "Run" to execute

**What this migration does:**
- Enables Row Level Security (RLS) on the `documents` table
- Creates 4 policies allowing authenticated users to:
  - INSERT documents (upload)
  - SELECT documents (view)
  - UPDATE documents (edit metadata)
  - DELETE documents (remove)

**Troubleshooting:**
- If you get "policy already exists" error, that's OK - it means the policies are already in place
- If you get "permission denied" error, make sure you're logged in as the Supabase project owner

## Step 5: Configure Storage Buckets

1. In your Supabase dashboard, go to **Storage**
2. Create these buckets:
   - **Bucket Name**: `patient-documents`
     - Public: `false` (private)
     - File size limit: 50MB
     - Allowed MIME types: `application/pdf, image/png, image/jpeg`
   
3. Set up Storage Policies for `patient-documents` bucket:
   - Go to the bucket → **Policies** → **New Policy**
   - Create these policies:

   **Policy 1: Allow authenticated users to upload**
   ```sql
   CREATE POLICY "Authenticated users can upload documents"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'patient-documents');
   ```

   **Policy 2: Allow authenticated users to read documents**
   ```sql
   CREATE POLICY "Authenticated users can read documents"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'patient-documents');
   ```

   **Policy 3: Allow authenticated users to delete documents**
   ```sql
   CREATE POLICY "Authenticated users can delete documents"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'patient-documents');
   ```

**Note:** Both the documents TABLE policies (Step 4) AND the storage.objects policies (Step 5) are required for document upload to work properly!

## Step 6: Create Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click "Add user"
3. Create user:
   - Email: `jgabbard61@lab.com` (or your email)
   - Password: `Admin123!`
   - Auto Confirm User: `Yes`
4. After user is created, copy the User ID (UUID)
5. Go to **SQL Editor** and run:
   ```sql
   INSERT INTO users (id, username, email, role, full_name)
   VALUES 
   ('<paste-user-uuid-here>', 'Jgabbard61', 'jgabbard61@lab.com', 'admin', 'J Gabbard'),
   -- Default test user
   ('00000000-0000-0000-0000-000000000000', 'john@doe.com', 'john@doe.com', 'admin', 'John Doe');
   ```

## Step 7: Environment Variables

Create/update `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Abacus AI for OCR/Document Parsing
ABACUSAI_API_KEY=your_abacus_api_key
```

## Step 8: Vercel Deployment

### Prepare GitHub Repository

1. Initialize git in your project:
   ```bash
   cd patient_crm/nextjs_space
   git init
   git add .
   git commit -m "Initial commit: Patient CRM"
   ```

2. Create a new repository on GitHub
3. Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/patient-crm.git
   git branch -M main
   git push -u origin main
   ```

### Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your `patient-crm` repository
5. Configure:
   - Framework Preset: `Next.js`
   - Root Directory: `nextjs_space`
   - Build Command: `yarn build`
   - Output Directory: `.next`
6. Add Environment Variables (from your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_URL` (set to your Vercel deployment URL, e.g., `https://patient-crm.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `ABACUSAI_API_KEY`
7. Click "Deploy"

### Post-Deployment

1. Update `NEXTAUTH_URL` in Vercel environment variables to your actual deployment URL
2. Redeploy the application
3. In Supabase dashboard, go to **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Site URL** and **Redirect URLs**

## Troubleshooting

### Database Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active (not paused)

### Authentication Issues
- Ensure user exists in both Supabase Auth and `users` table
- Verify `NEXTAUTH_URL` matches your deployment URL

### Storage Upload Issues
- Verify storage policies are correctly set
- Check file size limits (default 50MB)
- Ensure MIME types are allowed

### Development Mode
```bash
cd patient_crm/nextjs_space
yarn dev
```
Access at: http://localhost:3000

---
END:file=/home/ubuntu/patient_crm/SUPABASE_SETUP.md---
---BEGIN:file=/home/ubuntu/patient_crm/supabase/schema.sql---
-- Patient CRM Database Schema for Supabase
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- admin, user, viewer
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    gender TEXT, -- Male, Female, Other
    date_of_birth DATE NOT NULL,
    address TEXT,
    medicare_id TEXT,
    insurance_payer TEXT,
    policy_number TEXT,
    icd10_codes TEXT[], -- Array of ICD-10 codes
    referring_physician TEXT,
    npi_number TEXT,
    clinic_facility TEXT,
    sales_rep TEXT,
    fax TEXT,
    comments TEXT,
    jg_comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create index for patient matching (Last Name + DOB)
CREATE INDEX idx_patients_lastname_dob ON patients(last_name, date_of_birth);
CREATE INDEX idx_patients_lastname ON patients(last_name);

-- =====================================================
-- TESTS/CLAIMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL, -- Immunodeficiency, Eye Disorder, CGx, UTI, GI, PGX, Thyroid, Cardio Pulmonary, Neuro
    accession_id TEXT,
    date_of_service DATE, -- DOS (Collection Date)
    result_in_date DATE,
    result_fax_date DATE,
    claim_status TEXT DEFAULT 'Pending', -- Pending, Finalized, Denied
    billed_date DATE,
    claim_number TEXT,
    charges DECIMAL(10, 2),
    paid DECIMAL(10, 2),
    ded_coins DECIMAL(10, 2), -- Deductible/Coinsurance
    patient_responsibility DECIMAL(10, 2),
    check_eft_number TEXT,
    check_eft_date DATE,
    payment_number TEXT,
    payment_date DATE,
    deductible DECIMAL(10, 2),
    mr TEXT, -- Medical Records
    correction_requests TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(patient_id, test_type) -- Prevent duplicate test types for same patient
);

CREATE INDEX idx_tests_patient_id ON tests(patient_id);
CREATE INDEX idx_tests_test_type ON tests(test_type);
CREATE INDEX idx_tests_claim_status ON tests(claim_status);
CREATE INDEX idx_tests_date_of_service ON tests(date_of_service);

-- =====================================================
-- CPT CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cpt_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    test_types TEXT[], -- Array of test types this CPT code is associated with
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TEST CPT CODES JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS test_cpt_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    cpt_code_id UUID NOT NULL REFERENCES cpt_codes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(test_id, cpt_code_id)
);

CREATE INDEX idx_test_cpt_codes_test_id ON test_cpt_codes(test_id);
CREATE INDEX idx_test_cpt_codes_cpt_code_id ON test_cpt_codes(cpt_code_id);

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE, -- Optional: link to specific test
    document_type TEXT NOT NULL, -- Lab Result, EOB, Prior Authorization, Requisition
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Supabase storage path
    file_size INTEGER, -- in bytes
    mime_type TEXT,
    extracted_data JSONB, -- OCR/AI extracted data
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_test_id ON documents(test_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);

-- =====================================================
-- PRIOR AUTHORIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prior_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    pa_status TEXT DEFAULT 'Pending', -- Pending, Approved, Denied
    pa_number TEXT,
    requested_date DATE,
    approval_date DATE,
    denial_date DATE,
    denial_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_prior_authorizations_patient_id ON prior_authorizations(patient_id);
CREATE INDEX idx_prior_authorizations_pa_status ON prior_authorizations(pa_status);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- Created, Updated, Deleted, Document Uploaded, etc.
    entity_type TEXT NOT NULL, -- Patient, Test, Document, etc.
    changes JSONB, -- Store what changed (before/after values)
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_patient_id ON activity_logs(patient_id);
CREATE INDEX idx_activity_logs_test_id ON activity_logs(test_id);
CREATE INDEX idx_activity_logs_performed_at ON activity_logs(performed_at);

-- =====================================================
-- EXCEL IMPORT LOGS TABLE (for tracking batch uploads)
-- =====================================================
CREATE TABLE IF NOT EXISTS excel_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    successful_rows INTEGER NOT NULL,
    failed_rows INTEGER NOT NULL,
    errors JSONB, -- Store any errors encountered
    imported_by UUID REFERENCES users(id),
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prior_authorizations_updated_at BEFORE UPDATE ON prior_authorizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpt_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cpt_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prior_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_import_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users full access (can be restricted later by role)
CREATE POLICY "Allow authenticated users full access to users"
    ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to patients"
    ON patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to tests"
    ON tests FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to cpt_codes"
    ON cpt_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to test_cpt_codes"
    ON test_cpt_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to documents"
    ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to prior_authorizations"
    ON prior_authorizations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to activity_logs"
    ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to excel_import_logs"
    ON excel_import_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA: Sample CPT Codes
-- =====================================================
INSERT INTO cpt_codes (code, description, test_types) VALUES
('81161', 'DMD Gene Analysis', ARRAY['Neuro', 'CGx']),
('81162', 'BRCA1 Gene Analysis', ARRAY['CGx']),
('81165', 'Full Gene Sequence', ARRAY['CGx']),
('81201', 'APC Gene Analysis', ARRAY['CGx']),
('81203', 'Known Familial Variant', ARRAY['CGx']),
('81479', 'Unlisted Molecular Pathology', ARRAY['CGx', 'PGX', 'Neuro']),
('87491', 'Infectious Agent Detection - UTI', ARRAY['UTI']),
('87505', 'Infectious Agent Detection - GI', ARRAY['GI']),
('81507', 'Fetal Aneuploidy DNA', ARRAY['CGx']),
('0029U', 'Drug Metabolism', ARRAY['PGX']),
('0169U', 'Cardio Pulmonary Panel', ARRAY['Cardio Pulmonary']),
('0170U', 'Thyroid Panel', ARRAY['Thyroid']),
('0171U', 'Immunodeficiency Panel', ARRAY['Immunodeficiency']),
('0172U', 'Eye Disorder Panel', ARRAY['Eye Disorder'])
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Patient CRM Database Schema Created Successfully!';
    RAISE NOTICE '📊 Tables: users, patients, tests, cpt_codes, documents, prior_authorizations, activity_logs';
    RAISE NOTICE '🔐 Row Level Security enabled on all tables';
    RAISE NOTICE '⏰ Triggers set up for automatic timestamp updates';
    RAISE NOTICE '📝 Next: Create admin user in Authentication section';
END $$;
