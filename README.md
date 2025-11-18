
# Patient CRM - Clinical Laboratory Management System

A comprehensive Patient CRM system for clinical medical laboratories performing PCR Testing (UTI, GI) and Genetic testing (Neuro, CGX, PGX, Eye disorder, Cardio Pulmonary, Thyroid, Immunodeficiency).

## 🚀 Features

### Patient Management
- ✅ Manual patient profile creation with comprehensive fields
- ✅ Smart patient matching by Last Name + DOB (prevents duplicates)
- ✅ Excel batch upload with intelligent patient matching
- ✅ Patient search by name or Medicare ID
- ✅ Complete patient history and profile tracking

### Test & Claims Management
- ✅ Multiple tests per patient (never duplicate same test type)
- ✅ Comprehensive claim tracking (Pending/Finalized/Denied)
- ✅ Payment status and financial tracking
- ✅ CPT code association with tests

### Document Management
- ✅ Upload PDFs, images for lab results, EOBs, requisitions, prior authorizations
- ✅ AI/OCR extraction for requisition forms (ICD codes, doctor info)
- ✅ AI/OCR extraction for EOBs (payment details, CPT codes, remarks)
- ✅ Secure cloud storage with Supabase
- ✅ Download and delete documents

### Reporting & Analytics
- ✅ Payer performance analysis (best/worst payers)
- ✅ Denial trends by payer, test type, CPT code
- ✅ Approval trends and approval rates
- ✅ Revenue by test type visualization
- ✅ Claims paid vs denied by payer
- ✅ Comprehensive filtering (Test Type, Payer, Date Range)
- ✅ Export all reports to Excel

### Security & Compliance
- ✅ Role-based access control (Admin for now, extensible)
- ✅ HIPAA-compliant security practices
- ✅ Activity logging for all patient profile changes
- ✅ Secure authentication with Supabase Auth

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git installed
- A Vercel account (for deployment)

## 🛠️ Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd patient_crm/nextjs_space
```

### Step 2: Install Dependencies

```bash
yarn install
```

### Step 3: Supabase Setup

Follow the detailed instructions in `SUPABASE_SETUP.md` or follow these quick steps:

1. **Create Supabase Project**
   - Go to supabase.com
   - Click "New Project"
   - Save your project URL and anon key

2. **Run Database Schema**
   - Open Supabase Dashboard → SQL Editor
   - Copy contents from `supabase/schema.sql`
   - Execute the entire script

3. **Configure Storage**
   - Go to Storage → Create bucket: `patient-documents`
   - Set bucket to private
   - Add storage policies (see `SUPABASE_SETUP.md`)

4. **Create Admin User**
   - Go to Authentication → Users → Add user
   - Email: `jgabbard61@lab.com`
   - Password: `Admin123!`
   - Auto Confirm: Yes
   - Run SQL to add user to users table (see `SUPABASE_SETUP.md`)

### Step 4: Environment Variables

Create `.env.local` file:

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

### Step 5: Run Development Server

```bash
yarn dev
```

Visit http://localhost:3000

**Default Login Credentials:**
- Username: `Jgabbard61`
- Password: `Admin123!`

## 🚀 Deployment to Vercel

### Step 1: Prepare GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Patient CRM"
git remote add origin https://github.com/yourusername/patient-crm.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your `patient-crm` repository
5. Configure:
   - Framework Preset: `Next.js`
   - Root Directory: `nextjs_space`
   - Build Command: `yarn build`
   - Output Directory: `.next`

6. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_URL` (set to your Vercel URL after first deploy)
   - `NEXTAUTH_SECRET`
   - `ABACUSAI_API_KEY`

7. Click "Deploy"

### Step 3: Post-Deployment

1. Update `NEXTAUTH_URL` in Vercel environment variables to your deployment URL
2. Redeploy
3. In Supabase Dashboard → Authentication → URL Configuration:
   - Add your Vercel URL to **Site URL** and **Redirect URLs**

## 📊 Excel Import Format

The system expects Excel files with these headers:

```
Accession, Claim Status, Test/Modality, DOS(COLLECTION), First Name, Last Name, 
Gender, Date of Birth, Address, ICD-10 Code, Result-In Date, Result Fax Date, 
Ref Physician, NPI#, Clinic/Facility/Ref Lab, Sales Rep, Insurance, Policy, 
Comments, Billed Date, Claim, Charges, Paid, Ded/Coins, Patient Responsibility, 
Check/EFT#, Check/EFT Date, JG Comments, MR, Payment #, Payment Date, 
Correction/Requests, Deductible, Fax
```

**Smart Matching Logic:**
- Patients are matched by **Last Name + Date of Birth**
- New profiles created if no match found
- Existing profiles updated with missing information
- **Never creates duplicate patients**
- **Never creates duplicate test types for same patient**

## 🧪 Test Types

The system supports these test types:
- Immunodeficiency
- Eye Disorder
- CGx
- UTI
- GI
- PGX
- Thyroid
- Cardio Pulmonary
- Neuro

## 📁 Project Structure

```
nextjs_space/
├── app/
│   ├── api/                    # API routes
│   │   ├── patients/          # Patient CRUD
│   │   ├── tests/             # Test/Claim CRUD
│   │   ├── documents/         # Document upload/download
│   │   └── import/            # Excel import
│   ├── dashboard/             # Main dashboard pages
│   │   ├── patients/          # Patient management
│   │   ├── reports/           # Analytics & reports
│   │   └── import/            # Excel import UI
│   ├── login/                 # Authentication
│   └── layout.tsx             # Root layout
├── components/                 # React components
├── lib/
│   ├── supabase/              # Supabase client & queries
│   ├── auth.ts                # Authentication helpers
│   └── utils.ts               # Utilities
├── supabase/
│   └── schema.sql             # Database schema
└── public/                     # Static assets
```

## 🔒 Security Notes

- All patient data stored in Supabase with Row Level Security (RLS) enabled
- Documents stored in private Supabase Storage bucket
- Authentication required for all dashboard routes
- Activity logging tracks all changes with user attribution
- HIPAA-compliant security practices implemented

## 🐛 Troubleshooting

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

### Excel Import Issues
- Check headers match expected format
- Verify date formats are readable
- Check for required fields: Last Name, Date of Birth

## 📝 License

This project is proprietary software for clinical laboratory use.

## 🤝 Support

For support, please contact your system administrator.

---

**Built with:**
- Next.js 14
- React 18
- Supabase (PostgreSQL + Storage + Auth)
- TypeScript
- Tailwind CSS
- Recharts
- Excel parsing (xlsx)
- AI/OCR (Abacus.AI)
