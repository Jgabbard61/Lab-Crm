
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { uploadDocument } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

/**
 * ✅ SECURITY FIX: Sanitize error messages to prevent database details from leaking
 */
function sanitizeErrorMessage(error: any): string {
  const message = error?.message || '';

  // Block database-specific error messages
  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'A document with this information already exists';
  }
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Invalid reference in document data';
  }
  if (message.includes('permission') || message.includes('policy')) {
    return 'You do not have permission to perform this action';
  }
  if (message.includes('storage') || message.includes('bucket')) {
    return 'File storage error occurred';
  }

  // Return safe, generic messages for known errors
  if (message.includes('Missing required fields') || message.includes('Invalid file type') || message.includes('File too large')) {
    return message; // These are our safe validation messages
  }

  // Default generic message for unknown errors
  return 'Upload failed. Please try again.';
}

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

        // ✅ SECURITY FIX: Validate file type (prevent malicious file uploads)
        const allowedMimeTypes = [
          // PDF documents
          'application/pdf',
          // Images
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/tiff',
          'image/tif',
          'image/bmp',
          'image/webp',
          // Microsoft Office
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel', // .xls
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          // Text and CSV
          'text/plain',
          'text/csv',
          'application/csv',
        ];

        const allowedExtensions = [
          '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.tif', '.tiff', '.bmp', '.webp',
          '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
        ];

        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        const mimeType = file.type.toLowerCase();

        if (!allowedMimeTypes.includes(mimeType) && !allowedExtensions.includes(fileExtension)) {
          throw new Error(
            `Invalid file type. Allowed types: PDF, images (JPG, PNG, GIF, TIFF), ` +
            `Microsoft Office (DOC, DOCX, XLS, XLSX), text files (TXT, CSV). ` +
            `Received: ${file.type || 'unknown'}`
          );
        }

        // ✅ SECURITY FIX: Enforce file size limit (prevent DoS via large uploads)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File too large. Maximum size: 50MB. ` +
            `Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
          );
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
        // ✅ SECURITY FIX: Sanitize error message to prevent database details from leaking
        const errorMessage = sanitizeErrorMessage(error);

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


