
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create authenticated server-side Supabase client
    const supabase = createServerClient();
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get document from database
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params?.id)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate signed URL (expires in 1 hour)
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('patient-documents')
      .createSignedUrl(document?.file_path, 3600);

    if (signedError || !signedData) {
      console.error('Error generating signed URL:', signedError);
      throw new Error('Failed to generate download URL');
    }

    return NextResponse.json({ url: signedData.signedUrl });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
