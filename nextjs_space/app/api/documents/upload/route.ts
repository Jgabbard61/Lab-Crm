
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
    console.error('[Document Upload] Session error:', sessionError);
    return new Response(
      JSON.stringify({ error: `Authentication error: ${sessionError.message}` }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  if (!session) {
    console.error('[Document Upload] No session found');
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Please log in again' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const userId = session.user.id;
  console.log('[Document Upload] User authenticated:', userId);
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.log('[Document Upload] Starting upload process');
        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const patientId = formData.get('patient_id') as string;
        const documentType = formData.get('document_type') as string;
        const documentCategoryValue = formData.get('document_category') as string;
        const documentCategory: 'Results' | 'EOBs' | 'Denials' | 'Payments' | 'Insurance Correspondence' = 
          (documentCategoryValue as any) || 'Results';

        console.log('[Document Upload] Form data:', {
          fileName: file?.name,
          patientId,
          documentType,
          documentCategory,
          fileSize: file?.size,
        });

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

        console.log('[Document Upload] Uploading file to storage...');
        
        // Upload file to Supabase storage using authenticated server client
        const { path: filePath, url: fileUrl } = await uploadDocument(file, patientId, documentType, supabase);
        
        console.log('[Document Upload] File uploaded to storage:', filePath);

        // Send progress update
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Saving document...' })}\n\n`)
        );

        // Save document metadata to database
        console.log('[Document Upload] Saving document metadata to database...');
        
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
          console.error('[Document Upload] Database error:', docError);
          throw new Error(`Failed to save document: ${docError.message}`);
        }

        console.log('[Document Upload] Document saved to database:', document.id);

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
          console.log('[Document Upload] Activity logged successfully');
        } catch (logError) {
          console.error('[Document Upload] Error logging activity:', logError);
          // Continue even if logging fails
        }

        console.log('[Document Upload] Upload completed successfully');

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'completed', document })}\n\n`)
        );
      } catch (error: any) {
        console.error('[Document Upload] Upload error:', error);
        console.error('[Document Upload] Error stack:', error?.stack);
        
        const errorMessage = error?.message || 'Upload failed. Please try again.';
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'error', 
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
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


