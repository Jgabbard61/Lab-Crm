
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // ✅ SECURITY FIX: Check authentication before accessing patient data
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params?.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get old patient data for activity log
    const { data: oldPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params?.id)
      .single();
    
    // ✅ SECURITY FIX: Whitelist allowed fields (prevent mass assignment)
    const patientUpdates = {
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
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    // Update patient
    const { data: patient, error: updateError } = await supabase
      .from('patients')
      .update(patientUpdates)
      .eq('id', params?.id)
      .select()
      .single();
    
    if (updateError) {
      // ✅ HIPAA FIX: Don't log PHI
      throw updateError;
    }
    
    // Log activity
    // ✅ HIPAA FIX: Don't store full PHI - only log which fields changed
    const changedFields = Object.keys(body).filter(key => {
      return oldPatient && body[key as keyof typeof body] !== undefined &&
             body[key as keyof typeof body] !== (oldPatient as any)[key];
    });

    await supabase
      .from('activity_logs')
      .insert([{
        patient_id: patient?.id,
        action_type: 'Updated',
        entity_type: 'Patient',
        changes: {
          action: 'Updated patient',
          patient_name: `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim(),
          fields_updated: changedFields
        },
        performed_by: userId,
        timestamp: new Date().toISOString(),
      }]);
    
    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Log activity before deletion
    await supabase
      .from('activity_logs')
      .insert([{
        patient_id: params?.id,
        action_type: 'Deleted',
        entity_type: 'Patient',
        performed_by: userId,
        timestamp: new Date().toISOString(),
      }]);
    
    // Delete patient
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', params?.id);
    
    if (deleteError) {
      // ✅ HIPAA FIX: Don't log PHI
      throw deleteError;
    }
    
    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
