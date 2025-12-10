import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// PUT /api/tests/[id] - Update a test
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const supabase = createServerClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const testId = params.id;

    // Get the test to check if it exists and get the patient_id for activity log
    const { data: existingTest, error: fetchError } = await supabase
      .from('tests')
      .select('patient_id, test_type')
      .eq('id', testId)
      .single();

    if (fetchError || !existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // ✅ SECURITY: Whitelist allowed fields (prevent mass assignment)
    const testUpdates = {
      // Test Information
      test_type: body.test_type,
      accession_id: body.accession_id,
      date_of_service: body.date_of_service,
      date_reported: body.date_reported,
      result_in_date: body.result_in_date,
      result_fax_date: body.result_fax_date,

      // Kit Shipment fields
      kit_shipped_date: body.kit_shipped_date,
      kit_shipment_tracking: body.kit_shipment_tracking,
      kit_return_tracking: body.kit_return_tracking,
      kit_received_date: body.kit_received_date,
      kit_shipment_status: body.kit_shipment_status,

      // Accessioning fields
      accessioning_status: body.accessioning_status,
      accessioning_date: body.accessioning_date,
      accessioning_notes: body.accessioning_notes,

      // Lab Processing fields
      sent_to_lab_date: body.sent_to_lab_date,
      results_received_date: body.results_received_date,

      // Billing & Claims
      claim_status: body.claim_status,
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

      // Server-controlled system fields
      updated_at: new Date().toISOString(),
      updated_by: session.user.id,
    };

    // Update the test
    const { data: test, error } = await supabase
      .from('tests')
      .update(testUpdates)
      .eq('id', testId)
      .select()
      .single();

    if (error) {
      console.error('Error updating test:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the activity
    await supabase.from('activity_logs').insert({
      patient_id: existingTest.patient_id,
      test_id: testId,
      action_type: 'Updated',
      entity_type: 'Test',
      changes: { before: existingTest, after: body },
      performed_by: session.user.id,
    });

    return NextResponse.json({ data: test }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/tests/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update test' },
      { status: 500 }
    );
  }
}

// DELETE /api/tests/[id] - Delete a test
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const supabase = createServerClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testId = params.id;

    // Get the test before deleting for activity log
    const { data: existingTest, error: fetchError } = await supabase
      .from('tests')
      .select('patient_id, test_type')
      .eq('id', testId)
      .single();

    if (fetchError || !existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Log the activity before deletion
    await supabase.from('activity_logs').insert({
      patient_id: existingTest.patient_id,
      test_id: testId,
      action_type: 'Deleted',
      entity_type: 'Test',
      changes: { deleted: existingTest },
      performed_by: session.user.id,
    });

    // Delete the test
    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId);

    if (error) {
      console.error('Error deleting test:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Test deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/tests/[id]:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}
