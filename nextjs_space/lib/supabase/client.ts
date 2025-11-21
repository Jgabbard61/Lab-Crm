
// Supabase Client Configuration
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create Supabase client with cookie-based session management
// This ensures the session is available to both client and server (middleware)
export const supabase = createClientComponentClient();

// Database types (based on schema)
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth: string;
  address?: string;
  medicare_id?: string;
  insurance_payer?: string;
  policy_number?: string;
  icd10_codes?: string[];
  referring_physician?: string;
  npi_number?: string;
  reference_laboratory?: string;
  clinic_facility?: string; // Deprecated, use reference_laboratory
  sales_rep?: string;
  fax?: string;
  comments?: string;
  jg_comments?: string;
  status?: 'Claim Pending' | 'Billed' | 'Claim Received' | 'Paid in Full' | 'Partial Payment' | 'Denied';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Test {
  id: string;
  patient_id: string;
  test_type: string;
  accession_id?: string;
  date_of_service?: string;
  date_reported?: string;
  result_in_date?: string;
  result_fax_date?: string;
  claim_status: 'Pending' | 'Finalized' | 'Denied';
  billed_date?: string;
  claim_number?: string;
  charges?: number;
  paid?: number;
  ded_coins?: number;
  patient_responsibility?: number;
  check_eft_number?: string;
  check_eft_date?: string;
  payment_number?: string;
  payment_date?: string;
  deductible?: number;
  mr?: string;
  correction_requests?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CptCode {
  id: string;
  code: string;
  description?: string;
  test_types?: string[];
  created_at: string;
}

export interface Document {
  id: string;
  patient_id: string;
  test_id?: string;
  document_type: string;
  document_category?: 'Results' | 'EOBs' | 'Denials' | 'Payments' | 'Insurance Correspondence';
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  extracted_data?: any;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface PriorAuthorization {
  id: string;
  patient_id: string;
  test_id?: string;
  pa_status: 'Pending' | 'Approved' | 'Denied';
  pa_number?: string;
  requested_date?: string;
  approval_date?: string;
  denial_date?: string;
  denial_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ActivityLog {
  id: string;
  patient_id?: string;
  test_id?: string;
  action_type: string;
  entity_type: string;
  changes?: any;
  performed_by?: string;
  performed_at: string;
}

export interface ExcelImportLog {
  id: string;
  file_name: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  errors?: any;
  imported_by?: string;
  imported_at: string;
}
