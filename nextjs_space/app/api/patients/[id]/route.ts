
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
    
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params?.id)
      .single();
    
    if (error) throw error;
    
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
    
    // Update patient
    const { data: patient, error: updateError } = await supabase
      .from('patients')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params?.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating patient:', updateError);
      throw updateError;
    }
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        patient_id: patient?.id,
        action_type: 'Updated',
        entity_type: 'Patient',
        changes: { before: oldPatient, after: body },
        performed_by: userId,
        timestamp: new Date().toISOString(),
      }]);
    
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
      console.error('Error deleting patient:', deleteError);
      throw deleteError;
    }
    
    return NextResponse.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to delete patient' },
      { status: 500 }
    );
  }
}
