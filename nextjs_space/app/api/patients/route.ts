
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for existing patient with same last name and DOB
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .ilike('last_name', body?.last_name)
      .eq('date_of_birth', body?.date_of_birth)
      .maybeSingle();
    
    if (existingPatient) {
      return NextResponse.json(
        { message: 'Patient with this last name and date of birth already exists' },
        { status: 409 }
      );
    }
    
    // ✅ SECURITY FIX: Whitelist allowed fields (prevent mass assignment)
    const patientData = {
      // Basic Information
      first_name: body.first_name,
      last_name: body.last_name,
      gender: body.gender,
      date_of_birth: body.date_of_birth,
      ethnicity: body.ethnicity,

      // Contact Information
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      phone: body.phone,
      fax: body.fax,

      // Insurance & Billing
      medicare_id: body.medicare_id,
      insurance_payer: body.insurance_payer,
      policy_number: body.policy_number,
      status: body.status,

      // Medical Information
      icd10_codes: body.icd10_codes,
      personal_history: body.personal_history,
      family_history: body.family_history,

      // Clinical References
      referring_physician: body.referring_physician,
      npi_number: body.npi_number,
      reference_laboratory: body.reference_laboratory,
      clinic_facility: body.clinic_facility,
      sales_rep: body.sales_rep,

      // Comments & Notes
      comments: body.comments,
      jg_comments: body.jg_comments,
      mr: body.mr,

      // Server-controlled audit fields
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
    };

    // Create patient
    const { data: patient, error: createError } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating patient:', createError);
      throw createError;
    }
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        patient_id: patient?.id,
        action_type: 'Created',
        entity_type: 'Patient',
        changes: { created: body },
        performed_by: userId,
        timestamp: new Date().toISOString(),
      }]);
    
    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to create patient' },
      { status: 500 }
    );
  }
}
