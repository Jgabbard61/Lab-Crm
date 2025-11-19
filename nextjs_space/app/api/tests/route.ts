
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
    
    // Check for existing test with same patient and test type
    const { data: existingTest } = await supabase
      .from('tests')
      .select('*')
      .eq('patient_id', body?.patient_id)
      .eq('test_type', body?.test_type)
      .maybeSingle();
    
    if (existingTest) {
      return NextResponse.json(
        { message: `Patient already has a test of type: ${body?.test_type}` },
        { status: 409 }
      );
    }
    
    // Create test
    const { data: test, error: createError } = await supabase
      .from('tests')
      .insert([{
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating test:', createError);
      throw createError;
    }
    
    // Log activity
    await supabase
      .from('activity_logs')
      .insert([{
        patient_id: body?.patient_id,
        test_id: test?.id,
        action_type: 'Created',
        entity_type: 'Test',
        changes: { created: body },
        performed_by: userId,
        timestamp: new Date().toISOString(),
      }]);
    
    return NextResponse.json({ success: true, data: test }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to create test' },
      { status: 500 }
    );
  }
}
