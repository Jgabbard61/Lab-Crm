
// Supabase Database Query Helpers
import { supabase, Patient, Test, Document, ActivityLog } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// PATIENT QUERIES
// =====================================================

export async function getAllPatients(client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Patient[];
}

export async function getPatientById(patientId: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();
  
  if (error) throw error;
  return data as Patient;
}

export async function searchPatientsByLastName(lastName: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .select('*')
    .ilike('last_name', `%${lastName}%`)
    .order('last_name', { ascending: true });
  
  if (error) throw error;
  return data as Patient[];
}

export async function findPatientByNameAndDOB(lastName: string, dateOfBirth: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .select('*')
    .ilike('last_name', lastName)
    .eq('date_of_birth', dateOfBirth)
    .maybeSingle();
  
  if (error) throw error;
  return data as Patient | null;
}

export async function createPatient(patient: Partial<Patient>, userId?: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .insert({
      ...patient,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Patient;
}

export async function updatePatient(patientId: string, updates: Partial<Patient>, userId?: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('patients')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', patientId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Patient;
}

export async function deletePatient(patientId: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { error } = await db
    .from('patients')
    .delete()
    .eq('id', patientId);
  
  if (error) throw error;
  return true;
}

// =====================================================
// TEST/CLAIM QUERIES
// =====================================================

export async function getTestsByPatientId(patientId: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('tests')
    .select('*')
    .eq('patient_id', patientId)
    .order('date_of_service', { ascending: false });
  
  if (error) throw error;
  return data as Test[];
}

export async function getTestById(testId: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('tests')
    .select('*')
    .eq('id', testId)
    .single();
  
  if (error) throw error;
  return data as Test;
}

export async function createTest(test: Partial<Test>, userId?: string, client?: SupabaseClient) {
  const db = client || supabase;
  const { data, error } = await db
    .from('tests')
    .insert({
      ...test,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Test;
}

export async function updateTest(testId: string, updates: Partial<Test>, userId?: string) {
  const { data, error } = await supabase
    .from('tests')
    .update({
      ...updates,
      updated_by: userId,
    })
    .eq('id', testId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Test;
}

export async function deleteTest(testId: string) {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', testId);
  
  if (error) throw error;
  return true;
}

// =====================================================
// DOCUMENT QUERIES
// =====================================================

export async function getDocumentsByPatientId(patientId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('patient_id', patientId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw error;
  return data as Document[];
}

export async function getDocumentsByTestId(testId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('test_id', testId)
    .order('uploaded_at', { ascending: false });
  
  if (error) throw error;
  return data as Document[];
}

export async function createDocument(document: Partial<Document>) {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single();
  
  if (error) throw error;
  return data as Document;
}

export async function deleteDocument(documentId: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);
  
  if (error) throw error;
  return true;
}

// =====================================================
// ACTIVITY LOG QUERIES
// =====================================================

export async function getActivityLogsByPatientId(patientId: string) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, performed_by:users(full_name, username)')
    .eq('patient_id', patientId)
    .order('performed_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

export async function createActivityLog(log: Partial<ActivityLog>) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(log)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// =====================================================
// CPT CODE QUERIES
// =====================================================

export async function getAllCptCodes() {
  const { data, error } = await supabase
    .from('cpt_codes')
    .select('*')
    .order('code', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getCptCodesByTestType(testType: string) {
  const { data, error } = await supabase
    .from('cpt_codes')
    .select('*')
    .contains('test_types', [testType])
    .order('code', { ascending: true });
  
  if (error) throw error;
  return data;
}

// =====================================================
// ANALYTICS QUERIES
// =====================================================

export async function getPayerPerformance() {
  const { data, error } = await supabase
    .from('tests')
    .select('insurance_payer:patients(insurance_payer), claim_status, paid, charges')
    .not('insurance_payer', 'is', null);
  
  if (error) throw error;
  return data;
}

export async function getRevenueByTestType() {
  const { data, error } = await supabase
    .from('tests')
    .select('test_type, paid, charges')
    .order('test_type', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getDenialTrends(startDate?: string, endDate?: string) {
  let query = supabase
    .from('tests')
    .select('test_type, claim_status, date_of_service, patient:patients(insurance_payer)')
    .eq('claim_status', 'Denied');
  
  if (startDate) query = query.gte('date_of_service', startDate);
  if (endDate) query = query.lte('date_of_service', endDate);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}
