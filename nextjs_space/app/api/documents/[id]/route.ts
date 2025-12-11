
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { deleteDocument as deleteDocumentQuery } from '@/lib/supabase/queries';
import { deleteDocument as deleteDocumentStorage } from '@/lib/supabase/storage';
import { createActivityLog } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Get document info before deletion
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params?.id)
      .single();

    if (!document) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    await deleteDocumentStorage(document?.file_path);

    // Delete from database
    await deleteDocumentQuery(params?.id);

    // Log activity
    await createActivityLog({
      patient_id: document?.patient_id,
      action_type: 'Deleted',
      entity_type: 'Document',
      changes: { deleted: document },
      performed_by: userId,
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
