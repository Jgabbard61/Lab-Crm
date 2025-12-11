
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { uploadDocument } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Create server-side Supabase client OUTSIDE the stream to ensure cookie access
  const supabase = createServerClient();
  
  // Get current user session BEFORE starting the stream
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    // ✅ HIPAA FIX: Don't log PHI
    return new Response(
      JSON.stringify({ error: 'Authentication error' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!session) {
    // ✅ HIPAA FIX: Don't log PHI
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Please log in again' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userId = session.user.id;
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const patientId = formData.get('patient_id') as string;
        const documentType = formData.get('document_type') as string;
        const documentCategoryValue = formData.get('document_category') as string;
        const documentCategory: 'Results' | 'EOBs' | 'Denials' | 'Payments' | 'Insurance Correspondence' =
          (documentCategoryValue as any) || 'Results';

        if (!file || !patientId || !documentType) {
          const missingFields = [];
          if (!file) missingFields.push('file');
          if (!patientId) missingFields.push('patient_id');
          if (!documentType) missingFields.push('document_type');
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Send progress update
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Uploading to storage...' })}\n\n`)
        );

        // Upload file to Supabase storage using authenticated server client
        const { path: filePath, url: fileUrl } = await uploadDocument(file, patientId, documentType, supabase);

        // Send progress update
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Saving document...' })}\n\n`)
        );

        // Save document metadata to database
        const { data: document, error: docError } = await supabase
          .from('documents')
          .insert({
            patient_id: patientId,
            document_type: documentType,
            document_category: documentCategory,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: userId,
          })
          .select()
          .single();

        if (docError) {
          // ✅ HIPAA FIX: Don't log PHI
          throw new Error('Failed to save document');
        }

        // Log the activity
        try {
          await supabase.from('activity_logs').insert({
            patient_id: patientId,
            action_type: 'Document Uploaded',
            entity_type: 'Document',
            changes: {
              document_type: documentType,
              document_category: documentCategory,
              file_name: file.name,
              file_size: file.size
            },
            performed_by: userId,
          });
        } catch (logError) {
          // ✅ HIPAA FIX: Don't log PHI - Continue even if logging fails
        }

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'completed', document })}\n\n`)
        );
      } catch (error: any) {
        // ✅ HIPAA FIX: Don't log PHI or stack traces
        const errorMessage = error?.message || 'Upload failed. Please try again.';

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            status: 'error',
            message: errorMessage
          })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


