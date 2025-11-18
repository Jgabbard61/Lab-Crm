
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getPatientById, updatePatient, deletePatient } from '@/lib/supabase/queries';
import { createActivityLog } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patient = await getPatientById(params?.id);
    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Get old patient data for activity log
    const oldPatient = await getPatientById(params?.id);
    
    // Update patient
    const patient = await updatePatient(params?.id, body, userId);
    
    // Log activity
    await createActivityLog({
      patient_id: patient?.id,
      action_type: 'Updated',
      entity_type: 'Patient',
      changes: { before: oldPatient, after: body },
      performed_by: userId,
    });
    
    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    // Log activity before deletion
    await createActivityLog({
      patient_id: params?.id,
      action_type: 'Deleted',
      entity_type: 'Patient',
      performed_by: userId,
    });
    
    await deletePatient(params?.id);
    
    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
