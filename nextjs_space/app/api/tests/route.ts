
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createTest } from '@/lib/supabase/queries';
import { createActivityLog } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
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
    const test = await createTest(body, userId);
    
    // Log activity
    await createActivityLog({
      patient_id: body?.patient_id,
      test_id: test?.id,
      action_type: 'Created',
      entity_type: 'Test',
      changes: { created: body },
      performed_by: userId,
    });
    
    return NextResponse.json({ success: true, data: test }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to create test' },
      { status: 500 }
    );
  }
}
