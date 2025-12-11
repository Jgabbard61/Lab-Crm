import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Fetch notes for a test
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('test_id');
    const patientId = searchParams.get('patient_id');

    let query = supabase
      .from('test_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (testId) {
      query = query.eq('test_id', testId);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data: notes, error } = await query;

    if (error) throw error;

    return NextResponse.json(notes || []);
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { test_id, patient_id, note, priority, created_by } = body;

    if (!test_id || !patient_id || !note || !created_by) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newNote, error } = await supabase
      .from('test_notes')
      .insert([
        {
          test_id,
          patient_id,
          note,
          priority: priority || 'Low',
          created_by,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('activity_logs').insert([
      {
        patient_id,
        test_id,
        action_type: 'Note Added',
        entity_type: 'test_note',
        changes: { note, priority: priority || 'Low' },
        performed_by: created_by,
      },
    ]);

    return NextResponse.json(newNote, { status: 201 });
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
