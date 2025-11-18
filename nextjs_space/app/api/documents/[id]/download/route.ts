
import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/supabase/storage';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Generate signed URL
    const signedUrl = await getSignedUrl(document?.file_path, 3600);

    return NextResponse.json({ url: signedUrl });
  } catch (error: any) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
