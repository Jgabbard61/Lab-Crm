
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
    
    // Create patient
    const { data: patient, error: createError } = await supabase
      .from('patients')
      .insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
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
