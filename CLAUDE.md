# CLAUDE.md - Lab-Crm AI Assistant Guide

**Last Updated**: 2025-12-10
**Project**: Patient CRM - Clinical Laboratory Management System
**Tech Stack**: Next.js 14 + Supabase + TypeScript + Tailwind CSS

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema & Patterns](#database-schema--patterns)
4. [Codebase Structure](#codebase-structure)
5. [API Route Conventions](#api-route-conventions)
6. [Component Patterns](#component-patterns)
7. [Authentication & Authorization](#authentication--authorization)
8. [Development Workflows](#development-workflows)
9. [Key Conventions & Rules](#key-conventions--rules)
10. [Common Tasks & Patterns](#common-tasks--patterns)
11. [Critical Files Reference](#critical-files-reference)
12. [Gotchas & Important Notes](#gotchas--important-notes)

---

## Project Overview

### Purpose
Clinical laboratory management system for managing:
- **Patients**: Profiles with comprehensive medical and insurance information
- **Tests**: Lab test orders with 14-stage workflow tracking (kit shipment → payment)
- **Documents**: Lab results, EOBs, denials, requisitions with OCR extraction
- **Claims**: Billing and payment tracking with detailed financial data
- **Analytics**: Payer performance, denial trends, revenue analysis

### Business Domain
- **Laboratory Types**: PCR Testing (UTI, GI), Genetic Testing (Neuro, CGX, PGX, Eye Disorder, Cardio Pulmonary, Thyroid, Immunodeficiency)
- **Compliance**: HIPAA-compliant with activity logging and audit trails
- **Users**: Lab administrators, billing staff, clinical staff (role-based ready)

### Key Features
- Smart duplicate prevention (patients matched by last name + DOB)
- Excel batch import with intelligent field mapping (50+ header variations)
- Workflow-based test tracking (14 stages from kit shipment to payment)
- Document management with AI/OCR extraction (Abacus.AI)
- Comprehensive analytics and reporting with Excel export

---

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom theme
- **Components**: Shadcn UI (48 components) + custom components
- **Icons**: Lucide React
- **State Management**: Local state (useState), no global state library
- **Forms**: React Hook Form + Zod validation, Formik + Yup
- **Charts**: Recharts, Chart.js, Plotly.js
- **Excel Processing**: XLSX library

### Backend
- **API**: Next.js API Routes (App Router format)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password, cookie-based sessions)
- **Storage**: Supabase Storage (private bucket: `patient-documents`)
- **OCR/AI**: Abacus.AI API for document extraction

### Deployment
- **Platform**: Vercel
- **Root Directory**: `nextjs_space`
- **Build Command**: `yarn build`
- **Environment**: Node.js 18+

### Directory Layout
```
/home/user/Lab-Crm/
├── nextjs_space/              # Main Next.js application (all code here)
│   ├── app/                   # Next.js 14 App Router
│   ├── components/            # React components
│   ├── lib/                   # Utilities, helpers, types
│   ├── hooks/                 # Custom React hooks
│   ├── public/                # Static assets
│   ├── prisma/                # UNUSED - legacy (ignore this)
│   └── middleware.ts          # Auth middleware
├── supabase/                  # SQL migration files (actual database schema)
└── [Documentation files]
```

---

## Database Schema & Patterns

### PRIMARY DATABASE: SUPABASE (PostgreSQL)

**CRITICAL**: This project uses **Supabase**, NOT Prisma. Despite Prisma being in dependencies, it's legacy code and should be ignored.

### Core Tables

#### **users**
```typescript
{
  id: string (UUID)
  username: string (unique)
  email: string (unique)
  role: 'admin' | 'user' | 'viewer'
  full_name: string
  created_at: timestamp
  updated_at: timestamp
}
```
- Authentication: Username → Email lookup → Supabase Auth login
- Role field ready for RBAC (not currently enforced in code)

#### **patients** (Central entity)
```typescript
{
  id: string (UUID, primary key)

  // Basic Information
  first_name: string
  last_name: string
  gender: 'Male' | 'Female' | 'Other'
  date_of_birth: date
  ethnicity: string

  // Contact Information
  address: string
  city: string
  state: string
  zip: string
  phone: string
  fax: string

  // Insurance & Billing
  insurance_payer: string
  policy_number: string
  medicare_id: string
  status: 'Claim Pending' | 'Billed' | 'Paid in Full' | 'Partially Paid' | 'Denied' | 'Appeal in Progress'

  // Medical Information
  icd10_codes: string[] (array)
  personal_history: text
  family_history: text

  // Clinical References
  referring_physician: string
  npi_number: string
  reference_laboratory: string
  sales_rep: string

  // Comments & Notes
  comments: text
  jg_comments: text
  mr: text

  // Audit Fields
  created_by: string (user ID)
  updated_by: string (user ID)
  created_at: timestamp
  updated_at: timestamp
}
```

**Duplicate Prevention**: Patients are matched by `last_name` (case-insensitive) + `date_of_birth`

#### **tests** (Lab test orders & claims)
```typescript
{
  id: string (UUID)
  patient_id: string (foreign key → patients)
  test_type: 'Eye Disorder' | 'Immunodeficiency' | 'CGx' | 'UTI' | 'GI' | 'PGX' | 'Thyroid' | 'Cardio Pulmonary' | 'Neuro'
  accession_number: string

  // Kit Shipment Stage
  kit_shipped_date: date
  kit_shipment_tracking: string
  kit_return_tracking: string
  kit_received_date: date
  kit_shipment_status: 'Pending' | 'Shipped' | 'Delivered' | 'Returned'

  // Accessioning/QC Stage
  accessioning_status: 'Pending' | 'Accepted' | 'Rejected'
  accessioning_date: date
  accessioning_notes: text

  // Lab Processing Stage
  sent_to_lab_date: date
  results_received_date: date
  result_in_date: date
  result_fax_date: date

  // Billing & Claims
  claim_status: 'Pending' | 'Finalized' | 'Denied' | 'Approved' | 'Appeal in Progress'
  billed_date: date
  claim_number: string
  charges: decimal
  paid: decimal
  deductible: decimal
  patient_responsibility: decimal

  // Payment Tracking
  payment_number: string
  payment_date: date
  check_eft_number: string
  check_eft_date: date

  // Additional Fields
  correction_requests: text
  comments: text

  // Audit
  created_by: string
  updated_by: string
  created_at: timestamp
  updated_at: timestamp

  // UNIQUE CONSTRAINT: (patient_id, test_type)
  // A patient cannot have duplicate test types
}
```

**14 Workflow Stages**:
1. Kit Pending → Kit Shipped → Kit Delivered → Kit Returned
2. Accessioning Pending → Accepted/Rejected
3. Sent to Lab → Results Received → Results Faxed
4. Claim Pending → Billed → Finalized/Denied
5. Payment Received → Paid in Full

#### **test_notes**
```typescript
{
  id: string (UUID)
  test_id: string (foreign key → tests)
  patient_id: string (foreign key → patients)
  note: text
  priority: 'High' | 'Low'
  created_by: string
  created_at: timestamp
  updated_at: timestamp
}
```

#### **documents**
```typescript
{
  id: string (UUID)
  patient_id: string (foreign key → patients)
  test_id: string (nullable, foreign key → tests)
  file_name: string
  file_path: string (Supabase Storage path)
  file_size: integer (bytes)
  mime_type: string
  category: 'Results' | 'EOBs' | 'Denials' | 'Payments' | 'Insurance Correspondence' | 'Requisitions' | 'Prior Authorizations'
  extracted_data: jsonb (OCR results from Abacus.AI)
  uploaded_by: string
  uploaded_at: timestamp
}
```

#### **cpt_codes** & **test_cpt_codes**
```typescript
// cpt_codes
{
  id: string (UUID)
  code: string (unique)
  description: text
}

// test_cpt_codes (many-to-many)
{
  id: string (UUID)
  test_type: string
  cpt_code_id: string (foreign key → cpt_codes)
}
```

#### **activity_logs** (Audit trail)
```typescript
{
  id: string (UUID)
  patient_id: string (nullable)
  test_id: string (nullable)
  action_type: 'Created' | 'Updated' | 'Deleted' | 'Status Changed'
  entity_type: 'Patient' | 'Test' | 'Document' | 'Note'
  changes: jsonb (before/after values)
  performed_by: string (user ID)
  created_at: timestamp
}
```

#### **excel_import_logs**
```typescript
{
  id: string (UUID)
  file_name: string
  total_rows: integer
  successful_rows: integer
  failed_rows: integer
  errors: jsonb (row-level error details)
  imported_by: string
  imported_at: timestamp
}
```

### Row Level Security (RLS)

**All tables have RLS enabled.**

Current policy (simple):
```sql
CREATE POLICY "Allow all for authenticated users"
ON [table_name]
TO authenticated
USING (true);
```

**Ready for RBAC**: Users table has `role` field. When implementing role-based access:
1. Update RLS policies to check user role
2. Add role checks in API routes
3. Conditionally render UI based on role

### Storage Bucket

**Bucket Name**: `patient-documents`
**Access**: Private (requires authenticated access)
**Policies**:
- INSERT: Authenticated users can upload
- SELECT: Authenticated users can view/download
- DELETE: Authenticated users can delete

---

## Codebase Structure

### Working Directory
**All development happens in**: `/home/user/Lab-Crm/nextjs_space/`

### Key Directories

#### `/app/` - Next.js 14 App Router
```
app/
├── api/                    # API Routes (15 route handlers)
│   ├── auth/
│   │   ├── [...nextauth]/  # NextAuth (unused, legacy)
│   │   └── login/          # Supabase login endpoint
│   ├── patients/
│   │   ├── route.ts        # POST (create patient)
│   │   └── [id]/
│   │       └── route.ts    # GET, PUT, DELETE patient
│   ├── tests/
│   │   ├── route.ts        # POST (create test)
│   │   └── [id]/
│   │       └── route.ts    # GET, PUT, DELETE test
│   ├── test-notes/
│   ├── documents/
│   │   ├── upload/         # SSE streaming upload
│   │   └── [id]/
│   │       ├── route.ts    # GET, DELETE document
│   │       └── download/   # Download with signed URL
│   └── import/
│       ├── preview/        # Excel preview
│       └── execute/        # Excel import (431 lines!)
├── dashboard/              # Dashboard pages (Server Components)
│   ├── page.tsx            # Main dashboard
│   ├── patients/
│   │   ├── page.tsx        # Patient list
│   │   ├── [id]/
│   │   │   └── page.tsx    # Patient detail (tabs: Overview, Tests, Documents, Activity Log)
│   │   └── new/
│   │       └── page.tsx    # Create patient
│   ├── reports/
│   │   └── page.tsx        # Analytics & reports
│   └── import/
│       └── page.tsx        # Excel import UI
├── login/
│   └── page.tsx            # Login page
├── layout.tsx              # Root layout (providers)
├── page.tsx                # Root page (redirects)
└── providers.tsx           # React Query, Toaster providers
```

#### `/components/` - React Components

**Custom Components** (14 total):
```
components/
├── patient-table.tsx           # Advanced table with filters, search, badges (455 lines)
├── patient-form.tsx            # Comprehensive patient form with validation (18K lines)
├── patient-tests.tsx           # Test list with workflow tracking
├── patient-documents.tsx       # Document gallery with categories
├── patient-overview.tsx        # Patient summary card
├── patient-profile-tabs.tsx    # Tabbed interface
├── patient-activity-log.tsx    # Audit trail display
├── add-test-dialog.tsx         # Test creation modal
├── edit-test-dialog.tsx        # Test editing with workflow fields
├── test-notes.tsx              # Priority notes management
├── upload-document-dialog.tsx  # File upload with categories
├── excel-import.tsx            # Excel upload with preview
├── reports-analytics.tsx       # Charts and analytics
├── dashboard-header.tsx        # Navigation header
└── ui/                         # Shadcn UI components (48 total)
    ├── button.tsx, input.tsx, select.tsx, etc.
    ├── dialog.tsx, popover.tsx, dropdown-menu.tsx
    ├── table.tsx, calendar.tsx, tabs.tsx
    └── toast.tsx, alert.tsx, skeleton.tsx
```

#### `/lib/` - Utilities & Helpers
```
lib/
├── supabase/
│   ├── client.ts           # Supabase client + TypeScript interfaces (82 lines of types!)
│   ├── server.ts           # Server-side Supabase client (cookie handling)
│   ├── queries.ts          # Database query helpers (308 lines)
│   └── storage.ts          # File management helpers
├── auth.ts                 # Client-side auth helpers
├── auth-server.ts          # Server-side auth helpers (getServerSession, getServerUser)
├── db.ts                   # Prisma client (UNUSED - ignore this)
├── types.ts                # Additional TypeScript types
├── utils.ts                # Utility functions (cn, formatDuration)
└── constants.ts            # App constants (status options, test types, colors)
```

#### `/middleware.ts` - Authentication Middleware
Protects routes:
- `/dashboard/*`
- `/patients/*`
- `/reports/*`

Redirects:
- Unauthenticated → `/login`
- Root `/` → `/dashboard` (if authenticated) or `/login`

#### `/supabase/` - Database Migrations
```
supabase/
├── migration_1.sql         # Initial schema (users, patients, tests)
├── migration_2.sql         # Documents, activity_logs
├── migration_3.sql         # Additional fields
├── migration_4.sql         # Test notes, workflow fields
├── migration_5.sql         # Patient fields (ethnicity, jg_comments, mr)
└── migration_6.sql         # Address fields split
```

**Total**: 526 lines of SQL (complete database schema)

---

## API Route Conventions

### Pattern: Next.js 14 Route Handlers

#### File Structure
```
/app/api/[resource]/route.ts      # Collection (GET all, POST)
/app/api/[resource]/[id]/route.ts # Item (GET one, PUT, DELETE)
```

#### Standard Implementation Pattern

```typescript
// Example: /app/api/patients/route.ts

import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // 1. Create server-side Supabase client (handles cookies)
    const supabase = createServerClient();

    // 2. Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Get user
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    // 4. Parse request body
    const body = await req.json();

    // 5. Check for duplicates (if applicable)
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .ilike('last_name', body.last_name)
      .eq('date_of_birth', body.date_of_birth)
      .single();

    if (existing) {
      return NextResponse.json({
        error: 'Patient already exists'
      }, { status: 409 });
    }

    // 6. Create record
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...body,
        created_by: userData.id,
        updated_by: userData.id,
      })
      .select()
      .single();

    if (error) throw error;

    // 7. Log activity
    await supabase.from('activity_logs').insert({
      patient_id: data.id,
      action_type: 'Created',
      entity_type: 'Patient',
      changes: { created: body },
      performed_by: userData.id,
    });

    // 8. Return response
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Authentication Pattern
**Every API route must**:
1. Create server-side Supabase client
2. Check for session
3. Return 401 if unauthenticated
4. Get user from `users` table for audit trail

```typescript
const supabase = createServerClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const { data: userData } = await supabase
  .from('users')
  .select('id')
  .eq('email', session.user.email)
  .single();
```

### Duplicate Prevention Pattern

**Patients**: Check last name (case-insensitive) + DOB
```typescript
const { data: existing } = await supabase
  .from('patients')
  .select('id')
  .ilike('last_name', body.last_name)
  .eq('date_of_birth', body.date_of_birth)
  .single();

if (existing) {
  return NextResponse.json({ error: 'Patient already exists' }, { status: 409 });
}
```

**Tests**: Unique constraint in database `(patient_id, test_type)`
```typescript
// Database will reject duplicates automatically
// Return 409 Conflict on unique constraint violation
```

### Activity Logging Pattern
```typescript
await supabase.from('activity_logs').insert({
  patient_id: data.id,        // or null
  test_id: data.id,           // or null
  action_type: 'Created',     // Created | Updated | Deleted | Status Changed
  entity_type: 'Patient',     // Patient | Test | Document | Note
  changes: {
    created: body,            // For creates
    // OR
    before: oldData,          // For updates
    after: newData,
  },
  performed_by: userData.id,
});
```

### Error Handling Pattern
```typescript
try {
  // ... operation
} catch (error) {
  console.error('Error [operation]:', error);

  // Check for specific errors
  if (error.code === '23505') {
    // Unique constraint violation
    return NextResponse.json({ error: 'Duplicate entry' }, { status: 409 });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### File Upload Pattern (Server-Sent Events)

**Location**: `/app/api/documents/upload/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send progress updates
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'processing',
          message: 'Uploading file...'
        })}\n\n`));

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('patient-documents')
          .upload(filePath, file);

        // Send completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'complete',
          document: data
        })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          status: 'error',
          message: error.message
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

---

## Component Patterns

### Server Components vs Client Components

**Server Components** (in `/app/`):
- Fetch data directly in component
- No `'use client'` directive
- Cannot use hooks or event handlers
- Pass data to Client Components

```typescript
// app/dashboard/patients/page.tsx (Server Component)
import { getAllPatients } from '@/lib/supabase/queries';
import PatientTable from '@/components/patient-table';

export default async function PatientsPage() {
  const patients = await getAllPatients();

  return <PatientTable initialData={patients} />;
}
```

**Client Components** (in `/components/`):
- All marked with `'use client'`
- Use hooks, state, event handlers
- Handle user interactions

```typescript
// components/patient-table.tsx (Client Component)
'use client';

import { useState } from 'react';

export default function PatientTable({ initialData }) {
  const [patients, setPatients] = useState(initialData);
  // ... interactive logic
}
```

### Form Pattern (React Hook Form + Zod)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const patientSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  date_of_birth: z.string().min(1, 'Required'),
  // ... other fields
});

export default function PatientForm() {
  const form = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: { /* ... */ }
  });

  const onSubmit = async (data) => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    // ... handle response
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... form fields */}
    </form>
  );
}
```

### Dialog/Modal Pattern

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

export default function AddTestDialog({ patientId, onSuccess }) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (data) => {
    const response = await fetch('/api/tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, patient_id: patientId }),
    });

    if (response.ok) {
      setOpen(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Test</DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  );
}
```

### Data Fetching Pattern (Client-Side)

```typescript
'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function PatientTests({ patientId }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}/tests`);
        const data = await response.json();
        setTests(data);
      } catch (error) {
        toast.error('Failed to load tests');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [patientId]);

  if (loading) return <Skeleton />;

  return (
    <div>
      {tests.map(test => (
        <TestCard key={test.id} test={test} />
      ))}
    </div>
  );
}
```

### Table Pattern (with Filters & Search)

```typescript
'use client';

import { useMemo, useState } from 'react';

export default function PatientTable({ initialData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPatients = useMemo(() => {
    return initialData.filter(patient => {
      const matchesSearch =
        patient.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.medicare_id?.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'all' || patient.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialData, searchQuery, statusFilter]);

  return (
    <div>
      <input
        placeholder="Search patients..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {/* Table rendering */}
    </div>
  );
}
```

### Styling Conventions

**Tailwind Utility Pattern**:
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' && "variant-classes"
)} />
```

**Color System**:
- Primary: `bg-teal-600`, `text-teal-600`, `hover:bg-teal-700`
- Success: `bg-green-600`
- Warning: `bg-yellow-500`
- Danger: `bg-red-600`
- Neutral: `bg-gray-100`, `text-gray-600`

**Status Badge Pattern**:
```typescript
import { getStatusColor } from '@/lib/constants';

<span className={cn(
  "px-2 py-1 rounded-full text-xs font-medium",
  getStatusColor(status)
)}>
  {status}
</span>
```

---

## Authentication & Authorization

### Tech Stack
- **Supabase Auth** (email/password, cookie-based sessions)
- **NOT NextAuth** (despite being in dependencies - legacy code)

### Login Flow

**Client-Side** (`/app/login/page.tsx`):
```typescript
import { signIn } from '@/lib/auth';

const handleLogin = async (username, password) => {
  const { session, error } = await signIn({ username, password });
  if (session) {
    router.push('/dashboard');
  }
};
```

**Auth Helper** (`/lib/auth.ts`):
```typescript
export async function signIn({ username, password }) {
  // 1. Look up username in users table
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('username', username)
    .single();

  if (!user) return { error: 'Invalid credentials' };

  // 2. Sign in with email + password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password,
  });

  return { session: data.session, error };
}
```

### Server-Side Auth

**Get Current Session** (`/lib/auth-server.ts`):
```typescript
import { createServerClient } from '@/lib/supabase/server';

export async function getServerSession() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getServerUser() {
  const session = await getServerSession();
  if (!session) return null;

  const supabase = createServerClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  return data;
}
```

**Use in Server Component**:
```typescript
// app/dashboard/page.tsx
import { getServerUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  return <div>Welcome, {user.full_name}</div>;
}
```

**Use in API Route**:
```typescript
// app/api/patients/route.ts
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with authenticated request
}
```

### Middleware Protection

**`/middleware.ts`**:
```typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/patients/:path*', '/reports/:path*']
};
```

### Authorization (Role-Based - Ready, Not Implemented)

**Current State**: All authenticated users have full access

**Ready for RBAC**:
1. Users table has `role` field: `'admin' | 'user' | 'viewer'`
2. RLS policies can be updated to check role
3. API routes can check role from user object
4. UI can conditionally render based on role

**Example Implementation**:
```typescript
// lib/auth-server.ts
export async function requireRole(allowedRoles: string[]) {
  const user = await getServerUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

// app/api/patients/route.ts
export async function DELETE(req: NextRequest) {
  try {
    await requireRole(['admin']); // Only admins can delete
    // ... deletion logic
  } catch (error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

### Default Credentials

**Production Admin**:
- Username: `Jgabbard61`
- Email: `jgabbard61@lab.com`
- Password: `Admin123!`

---

## Development Workflows

### Local Development Setup

```bash
# 1. Navigate to Next.js app
cd /home/user/Lab-Crm/nextjs_space

# 2. Install dependencies
yarn install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# 4. Run development server
yarn dev

# Visit http://localhost:3000
```

### Environment Variables

**Required** (`.env.local`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# NextAuth Configuration (legacy, but required)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret

# Abacus AI for OCR/Document Parsing
ABACUSAI_API_KEY=your_abacus_api_key
```

### Database Setup

**Supabase Dashboard**:
1. Create new Supabase project
2. Go to SQL Editor
3. Run migrations in order:
   ```sql
   -- Execute /home/user/Lab-Crm/supabase/migration_1.sql
   -- Execute /home/user/Lab-Crm/supabase/migration_2.sql
   -- ... through migration_6.sql
   ```
4. Go to Storage → Create bucket `patient-documents` (Private)
5. Add storage policies (see migration files)

**Create Admin User**:
```sql
-- In Supabase SQL Editor
INSERT INTO public.users (username, email, role, full_name)
VALUES ('Jgabbard61', 'jgabbard61@lab.com', 'admin', 'John Gabbard');
```

Then go to Authentication → Users → Add user:
- Email: `jgabbard61@lab.com`
- Password: `Admin123!`
- Auto Confirm: Yes

### Build & Deployment

**Build locally**:
```bash
cd nextjs_space
yarn build
yarn start
```

**Deploy to Vercel**:
1. Push to GitHub
2. Import project in Vercel
3. Configure:
   - Framework: Next.js
   - Root Directory: `nextjs_space`
   - Build Command: `yarn build`
   - Output Directory: `.next`
4. Add environment variables
5. Deploy
6. Update `NEXTAUTH_URL` to deployment URL
7. Add deployment URL to Supabase Auth settings

### Git Workflow

**Current Branch**: `claude/claude-md-mizkxdkl26cr4ceh-012F4rpQR55fgSmyZbkzKMCv`

**Commit Pattern**:
```bash
git add .
git commit -m "Add feature: [description]"
git push -u origin claude/claude-md-mizkxdkl26cr4ceh-012F4rpQR55fgSmyZbkzKMCv
```

**Branch Naming**: Branches must start with `claude/` and end with session ID

---

## Key Conventions & Rules

### 1. ALWAYS Use Supabase, NEVER Prisma

**CRITICAL**: Despite Prisma being in dependencies, it's legacy code and should be ignored.

- Use `@/lib/supabase/client` or `@/lib/supabase/server`
- Use `@/lib/supabase/queries` helper functions
- Never import from `@/lib/db` (Prisma client)

### 2. Duplicate Prevention is MANDATORY

**Patients**: Check `last_name` (case-insensitive) + `date_of_birth` before creating

**Tests**: Database has unique constraint on `(patient_id, test_type)` - handle 409 errors

**Excel Import**: Smart matching logic in `/app/api/import/execute/route.ts`

### 3. Activity Logging Required

**When to log**:
- Patient created/updated/deleted
- Test created/updated/deleted
- Test status changed
- Document uploaded/deleted

**How to log**:
```typescript
await supabase.from('activity_logs').insert({
  patient_id: patientId,
  test_id: testId,
  action_type: 'Created',
  entity_type: 'Patient',
  changes: { created: data },
  performed_by: userId,
});
```

### 4. TypeScript Types from Supabase Schema

**Import types**:
```typescript
import { Patient, Test, Document } from '@/lib/supabase/client';
```

**82 lines of type definitions** in `/lib/supabase/client.ts` - use these!

### 5. Use Constants for Consistency

**Import constants**:
```typescript
import {
  TEST_STATUS_OPTIONS,
  TEST_TYPES,
  DOCUMENT_CATEGORIES,
  PATIENT_STATUS_OPTIONS,
  getStatusColor,
} from '@/lib/constants';
```

**Status badge example**:
```typescript
<span className={cn("px-2 py-1 rounded-full", getStatusColor(status))}>
  {status}
</span>
```

### 6. Workflow Tracking is Critical

**14 stages** in test lifecycle - each has specific fields:
1. Kit Shipment: `kit_shipped_date`, `kit_shipment_tracking`, `kit_shipment_status`
2. Accessioning: `accessioning_status`, `accessioning_date`, `accessioning_notes`
3. Lab Processing: `sent_to_lab_date`, `results_received_date`
4. Billing: `claim_status`, `billed_date`, `charges`, `paid`
5. Payment: `payment_date`, `check_eft_number`

**UI must display workflow progress** - use badges, progress indicators, dates

### 7. Document Categories Matter

**6 categories**:
- Results (green icon)
- EOBs (blue icon)
- Denials (red icon)
- Payments (teal icon)
- Insurance Correspondence (yellow icon)
- Requisitions (purple icon)
- Prior Authorizations (orange icon)

**Use category in UI** for filtering, icons, colors

### 8. Excel Import is Complex

**Location**: `/app/api/import/execute/route.ts` (431 lines)

**Key features**:
- 50+ header mapping variations
- Smart date parsing (Excel serial numbers + ISO strings)
- Upsert logic (create if new, update existing with non-empty values)
- Auto-derive fields (e.g., accessioning status from claim status)
- Row-level error tracking

**Don't modify unless necessary** - it's battle-tested logic

### 9. Server-Side Rendering (SSR) Pattern

**Server Components** fetch data:
```typescript
// app/dashboard/patients/page.tsx
import { getAllPatients } from '@/lib/supabase/queries';

export default async function PatientsPage() {
  const patients = await getAllPatients();
  return <PatientTable initialData={patients} />;
}
```

**Client Components** handle interactions:
```typescript
// components/patient-table.tsx
'use client';

export default function PatientTable({ initialData }) {
  const [patients, setPatients] = useState(initialData);
  // ... interactive logic
}
```

### 10. Security & Compliance

**HIPAA Compliance**:
- All patient data encrypted (Supabase default)
- Row Level Security (RLS) enabled on all tables
- Activity logging for audit trail
- Private document storage with signed URLs
- No patient data in logs or error messages

**Best practices**:
- Never log patient identifiable information
- Use signed URLs for document access (expire in 1 hour)
- Validate all inputs
- Sanitize data before display (XSS prevention)

---

## Common Tasks & Patterns

### Task 1: Add a New Patient Field

**Steps**:
1. Add column to `patients` table in Supabase SQL Editor
2. Update TypeScript interface in `/lib/supabase/client.ts`
3. Add field to patient form in `/components/patient-form.tsx`
4. Update patient table columns in `/components/patient-table.tsx`
5. Test creation, update, and display

**Example**:
```sql
-- Supabase SQL Editor
ALTER TABLE patients ADD COLUMN emergency_contact VARCHAR(255);
```

```typescript
// lib/supabase/client.ts
export interface Patient {
  // ... existing fields
  emergency_contact?: string;
}
```

```typescript
// components/patient-form.tsx
<Input
  label="Emergency Contact"
  {...form.register('emergency_contact')}
/>
```

### Task 2: Add a New Test Workflow Stage

**Steps**:
1. Add columns to `tests` table (e.g., `new_stage_date`, `new_stage_status`)
2. Update `Test` interface in `/lib/supabase/client.ts`
3. Add status option to `TEST_STATUS_OPTIONS` in `/lib/constants.ts`
4. Update test form in `/components/edit-test-dialog.tsx`
5. Update test display in `/components/patient-tests.tsx`

**Example**:
```sql
ALTER TABLE tests ADD COLUMN quality_control_date DATE;
ALTER TABLE tests ADD COLUMN quality_control_status VARCHAR(50);
```

```typescript
// lib/constants.ts
export const TEST_STATUS_OPTIONS = [
  // ... existing statuses
  { value: 'Quality Control', label: 'Quality Control', color: 'bg-indigo-500' },
];
```

### Task 3: Create a New API Endpoint

**Template**:
```typescript
// app/api/[resource]/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();

    // 1. Check auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Query database
    const { data, error } = await supabase
      .from('[table_name]')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 3. Return data
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching [resource]:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Task 4: Add a New Document Category

**Steps**:
1. Add category to `DOCUMENT_CATEGORIES` in `/lib/constants.ts`
2. Update document upload dialog in `/components/upload-document-dialog.tsx`
3. Update document display in `/components/patient-documents.tsx`
4. Test upload and display

**Example**:
```typescript
// lib/constants.ts
export const DOCUMENT_CATEGORIES = [
  // ... existing categories
  {
    value: 'Lab Reports',
    label: 'Lab Reports',
    icon: '📊',
    color: 'bg-cyan-500'
  },
];
```

### Task 5: Add Analytics/Report

**Steps**:
1. Create query function in `/lib/supabase/queries.ts`
2. Create chart component in `/components/reports-analytics.tsx`
3. Add to reports page in `/app/dashboard/reports/page.tsx`
4. Add export to Excel functionality

**Example**:
```typescript
// lib/supabase/queries.ts
export async function getTestVolumeByMonth(supabase?: SupabaseClient) {
  const client = supabase || createBrowserClient();

  const { data, error } = await client
    .from('tests')
    .select('created_at, test_type')
    .order('created_at', { ascending: true });

  // Process data for charting
  // Return formatted data
}
```

```typescript
// components/reports-analytics.tsx
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

export function TestVolumeChart({ data }) {
  return (
    <BarChart data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Bar dataKey="volume" fill="#0d9488" />
    </BarChart>
  );
}
```

### Task 6: Implement Role-Based Access Control

**Steps**:
1. Update RLS policies in Supabase
2. Add role check helper in `/lib/auth-server.ts`
3. Update API routes to check roles
4. Update UI to conditionally render based on role

**Example**:
```sql
-- Supabase SQL Editor
DROP POLICY IF EXISTS "Allow all for authenticated users" ON patients;

CREATE POLICY "Admins and users can view patients"
ON patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'user')
  )
);

CREATE POLICY "Only admins can delete patients"
ON patients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

```typescript
// lib/auth-server.ts
export async function requireRole(allowedRoles: string[]) {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthenticated');
  if (!allowedRoles.includes(user.role)) throw new Error('Forbidden');
  return user;
}
```

```typescript
// app/api/patients/[id]/route.ts
export async function DELETE(req: NextRequest, { params }) {
  try {
    await requireRole(['admin']);
    // ... deletion logic
  } catch (error) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Task 7: Debug Authentication Issues

**Common issues**:
1. **Session not persisting**: Check cookie settings in Supabase client
2. **Unauthorized on API calls**: Verify server-side client is using cookies
3. **User not in users table**: Check user exists in both Auth and users table
4. **Redirect loop**: Check middleware matcher and redirect logic

**Debug checklist**:
```typescript
// 1. Check session in Server Component
const session = await getServerSession();
console.log('Session:', session);

// 2. Check user in database
const user = await getServerUser();
console.log('User:', user);

// 3. Check Supabase Auth
const { data: { user: authUser } } = await supabase.auth.getUser();
console.log('Auth User:', authUser);

// 4. Check RLS policies
// Go to Supabase Dashboard → Authentication → Policies
// Verify policies allow authenticated users
```

---

## Critical Files Reference

### Must-Read Files

**Database Schema**:
- `/home/user/Lab-Crm/supabase/migration_1.sql` - Core tables
- `/home/user/Lab-Crm/supabase/migration_2.sql` - Documents & logs
- `/home/user/Lab-Crm/supabase/migration_5.sql` - Latest patient fields
- `/home/user/Lab-Crm/supabase/migration_6.sql` - Address fields

**Type Definitions**:
- `/home/user/Lab-Crm/nextjs_space/lib/supabase/client.ts` - All TypeScript interfaces

**Query Helpers**:
- `/home/user/Lab-Crm/nextjs_space/lib/supabase/queries.ts` - Database operations

**Constants**:
- `/home/user/Lab-Crm/nextjs_space/lib/constants.ts` - Status options, colors, test types

**Excel Import Logic**:
- `/home/user/Lab-Crm/nextjs_space/app/api/import/execute/route.ts` - 431 lines of import logic

**Authentication**:
- `/home/user/Lab-Crm/nextjs_space/lib/auth.ts` - Client-side auth
- `/home/user/Lab-Crm/nextjs_space/lib/auth-server.ts` - Server-side auth
- `/home/user/Lab-Crm/nextjs_space/middleware.ts` - Route protection

### Key Components

**Patient Management**:
- `/home/user/Lab-Crm/nextjs_space/components/patient-table.tsx` - 455 lines
- `/home/user/Lab-Crm/nextjs_space/components/patient-form.tsx` - 18K lines (comprehensive!)

**Test Management**:
- `/home/user/Lab-Crm/nextjs_space/components/patient-tests.tsx`
- `/home/user/Lab-Crm/nextjs_space/components/add-test-dialog.tsx`
- `/home/user/Lab-Crm/nextjs_space/components/edit-test-dialog.tsx`

**Document Management**:
- `/home/user/Lab-Crm/nextjs_space/components/patient-documents.tsx`
- `/home/user/Lab-Crm/nextjs_space/components/upload-document-dialog.tsx`

**Analytics**:
- `/home/user/Lab-Crm/nextjs_space/components/reports-analytics.tsx`

### Configuration Files

- `/home/user/Lab-Crm/nextjs_space/package.json` - Dependencies
- `/home/user/Lab-Crm/nextjs_space/next.config.js` - Next.js config
- `/home/user/Lab-Crm/nextjs_space/tsconfig.json` - TypeScript config
- `/home/user/Lab-Crm/nextjs_space/tailwind.config.ts` - Tailwind config

---

## Gotchas & Important Notes

### 1. Prisma is NOT Used

**DO NOT**:
- Use `@/lib/db` (Prisma client)
- Reference Prisma models
- Update `prisma/schema.prisma`

**DO**:
- Use `@/lib/supabase/client` or `@/lib/supabase/server`
- Reference TypeScript interfaces from `@/lib/supabase/client`
- Update Supabase schema via SQL migrations

### 2. Server-Side Supabase Client is Different

**Client-Side**:
```typescript
import { createBrowserClient } from '@/lib/supabase/client';
const supabase = createBrowserClient();
```

**Server-Side** (Server Components, API Routes):
```typescript
import { createServerClient } from '@/lib/supabase/server';
const supabase = createServerClient();
```

**Why**: Server client handles cookie-based session management

### 3. Patient Matching is Case-Insensitive

**When checking for duplicates**:
```typescript
// WRONG - case-sensitive
.eq('last_name', lastName)

// CORRECT - case-insensitive
.ilike('last_name', lastName)
```

### 4. Test Type Constraint

**Database enforces**: `UNIQUE (patient_id, test_type)`

A patient can have:
- ✅ Multiple tests of different types
- ❌ Multiple tests of the same type

**Handle constraint violations**:
```typescript
catch (error) {
  if (error.code === '23505') {
    return NextResponse.json({
      error: 'Patient already has this test type'
    }, { status: 409 });
  }
}
```

### 5. Excel Import Headers are Flexible

**The import logic handles 50+ header variations**:
- "DOS(COLLECTION)" → `dos_collection_date`
- "Date of Birth" / "DOB" / "Birth Date" → `date_of_birth`
- "First Name" / "First" / "Patient First Name" → `first_name`

**Don't modify header mapping** unless adding new variations

### 6. Document Storage Paths

**Format**: `patient-documents/{patientId}/{testId?}/{filename}`

**Signed URLs expire**: 1 hour (3600 seconds)

**Always generate fresh signed URLs** when displaying documents

### 7. Activity Logs Store JSONB

**Changes field** contains:
- For creates: `{ created: newData }`
- For updates: `{ before: oldData, after: newData }`
- For deletes: `{ deleted: oldData }`

**Use for audit trail display** - show what changed

### 8. Workflow Status Colors

**Defined in** `/lib/constants.ts`:
- Each status has specific color: `bg-teal-500`, `bg-blue-500`, etc.
- Use `getStatusColor(status)` helper for consistency
- Don't hardcode colors - use constants

### 9. Date Handling

**Database**: Stores dates as `DATE` type (YYYY-MM-DD)

**Excel Import**: Handles both Excel serial numbers and ISO strings

**Display**: Use `date-fns` or `dayjs` for formatting

```typescript
import { format } from 'date-fns';
format(new Date(date), 'MMM dd, yyyy');
```

### 10. RLS Policies Are Simple (For Now)

**Current policy**: All authenticated users have full access

**When implementing RBAC**:
1. Update RLS policies in Supabase
2. Test with different user roles
3. Handle 403 Forbidden errors in UI
4. Don't rely solely on UI hiding - enforce in database

### 11. Environment Variables

**Public vs Private**:
- `NEXT_PUBLIC_*` - Available in browser
- No prefix - Server-side only

**Supabase keys**:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe for client-side (RLS protected)
- Never expose service role key in client code

### 12. Build Errors vs Lint Errors

**Next.js config**:
```javascript
eslint: { ignoreDuringBuilds: true }      // Lint errors won't fail build
typescript: { ignoreBuildErrors: false }   // Type errors WILL fail build
```

**Always fix TypeScript errors** - they'll block deployment

### 13. Import Paths

**Use alias**: `@/` → project root
```typescript
import { Patient } from '@/lib/supabase/client';
import PatientForm from '@/components/patient-form';
```

**Don't use relative paths** for cleaner imports

### 14. Toast Notifications

**Library**: `react-hot-toast`

**Usage**:
```typescript
import toast from 'react-hot-toast';

toast.success('Patient created successfully');
toast.error('Failed to create patient');
toast.loading('Creating patient...');
```

**Provider** already set up in `/app/providers.tsx`

### 15. Excel Export

**All reports support Excel export**:
- Use `xlsx` library
- Export filtered data (respect current filters)
- Include column headers
- Format dates and numbers

**Example**:
```typescript
import * as XLSX from 'xlsx';

const exportToExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, 'report.xlsx');
};
```

---

## Quick Reference Commands

### Development
```bash
cd /home/user/Lab-Crm/nextjs_space
yarn dev                    # Start dev server
yarn build                  # Build for production
yarn start                  # Start production server
yarn lint                   # Run ESLint
```

### Git
```bash
git status                  # Check status
git add .                   # Stage changes
git commit -m "message"     # Commit
git push -u origin claude/[branch-name]  # Push to branch
```

### Useful Queries

**Check session**:
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

**Get all patients**:
```typescript
const { data } = await supabase.from('patients').select('*');
```

**Get patient tests**:
```typescript
const { data } = await supabase
  .from('tests')
  .select('*')
  .eq('patient_id', patientId);
```

**Search patients**:
```typescript
const { data } = await supabase
  .from('patients')
  .select('*')
  .or(`last_name.ilike.%${query}%,medicare_id.ilike.%${query}%`);
```

---

## Conclusion

This is a **production-grade clinical laboratory management system** with:
- Comprehensive workflow tracking (14 stages)
- Smart duplicate prevention
- Intelligent Excel import (50+ header variations)
- Document management with OCR
- Activity logging for compliance
- Analytics and reporting

**Key Principles**:
1. Always use Supabase (not Prisma)
2. Check for duplicates before creating
3. Log all activities for audit trail
4. Use TypeScript types from schema
5. Follow workflow stages
6. Respect constants for UI consistency
7. Test authentication thoroughly
8. Handle errors gracefully

**When in doubt**:
- Check existing patterns in similar components
- Reference critical files listed above
- Look at Excel import logic for complex examples
- Test with real data

---

**For updates or questions**, reference:
- README.md - Project overview
- SUPABASE_SETUP.md - Database setup
- This file (CLAUDE.md) - AI assistant guide

**Last updated**: 2025-12-10
