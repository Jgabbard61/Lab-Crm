import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE - Remove a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get note details before deleting
    const { data: note, error: fetchError } = await supabase
      .from('test_notes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('test_notes')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase.from('activity_logs').insert([
      {
        patient_id: note.patient_id,
        test_id: note.test_id,
        action_type: 'Note Deleted',
        entity_type: 'test_note',
        changes: { note: note.note, priority: note.priority },
        performed_by: session.user?.email || 'Unknown',
      },
    ]);

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting test note:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}

// PUT - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { note, priority } = body;

    if (!note) {
      return NextResponse.json(
        { message: 'Note content is required' },
        { status: 400 }
      );
    }

    // Get old note for logging
    const { data: oldNote } = await supabase
      .from('test_notes')
      .select('*')
      .eq('id', id)
      .single();

    // Update the note
    const { data: updatedNote, error } = await supabase
      .from('test_notes')
      .update({
        note,
        priority: priority || 'Low',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (oldNote) {
      await supabase.from('activity_logs').insert([
        {
          patient_id: oldNote.patient_id,
          test_id: oldNote.test_id,
          action_type: 'Note Updated',
          entity_type: 'test_note',
          changes: {
            before: { note: oldNote.note, priority: oldNote.priority },
            after: { note, priority: priority || 'Low' },
          },
          performed_by: session.user?.email || 'Unknown',
        },
      ]);
    }

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    console.error('Error updating test note:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to update note' },
      { status: 500 }
    );
  }
}
