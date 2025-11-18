
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createPatient } from '@/lib/supabase/queries';
import { createActivityLog } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
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
    
    // Create patient
    const patient = await createPatient(body, userId);
    
    // Log activity
    await createActivityLog({
      patient_id: patient?.id,
      action_type: 'Created',
      entity_type: 'Patient',
      changes: { created: body },
      performed_by: userId,
    });
    
    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to create patient' },
      { status: 500 }
    );
  }
}
