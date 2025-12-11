
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
    
    // ✅ SECURITY FIX: Whitelist allowed fields (prevent mass assignment)
    const testData = {
      // Required fields
      patient_id: body.patient_id,
      test_type: body.test_type,
      claim_status: body.claim_status || 'Pending',

      // Test Information
      accession_id: body.accession_id,
      date_of_service: body.date_of_service,
      date_reported: body.date_of_service,
      result_in_date: body.result_in_date,
      result_fax_date: body.result_fax_date,

      // Kit Shipment & Logistics
      kit_shipped_date: body.kit_shipped_date,
      kit_shipment_tracking: body.kit_shipment_tracking,
      kit_return_tracking: body.kit_return_tracking,
      kit_received_date: body.kit_received_date,
      kit_shipment_status: body.kit_shipment_status,

      // Accessioning/QC
      accessioning_status: body.accessioning_status,
      accessioning_date: body.accessioning_date,
      accessioning_notes: body.accessioning_notes,

      // Lab Processing
      sent_to_lab_date: body.sent_to_lab_date,
      results_received_date: body.results_received_date,

      // Billing & Claims
      billed_date: body.billed_date,
      claim_number: body.claim_number,
      charges: body.charges,
      paid: body.paid,
      ded_coins: body.ded_coins,
      patient_responsibility: body.patient_responsibility,
      check_eft_number: body.check_eft_number,
      check_eft_date: body.check_eft_date,
      payment_number: body.payment_number,
      payment_date: body.payment_date,
      deductible: body.deductible,
      mr: body.mr,
      correction_requests: body.correction_requests,
      comments: body.comments,

      // Server-controlled audit fields
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId,
    };

    // Create test
    const { data: test, error: createError } = await supabase
      .from('tests')
      .insert([testData])
      .select()
      .single();
    
    if (createError) {
      // ✅ HIPAA FIX: Don't log PHI
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
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}
