
import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createDocument } from '@/lib/supabase/queries';
import { uploadDocument } from '@/lib/supabase/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const patientId = formData.get('patient_id') as string;
        const documentType = formData.get('document_type') as string;

        if (!file || !patientId || !documentType) {
          throw new Error('Missing required fields');
        }

        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        // Send progress update
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Uploading to storage...' })}\n\n`)
        );

        // Upload file to Supabase storage
        const { path: filePath, url: fileUrl } = await uploadDocument(file, patientId, documentType);

        // Send progress update
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'processing', message: 'Extracting data with AI...' })}\n\n`)
        );

        // Extract data using AI/OCR if it's a PDF or image
        let extractedData = null;
        
        if (file.type === 'application/pdf' || file.type?.startsWith('image/')) {
          try {
            extractedData = await extractDocumentData(file, documentType);
          } catch (error) {
            console.error('Error extracting data:', error);
            // Continue without extracted data
          }
        }

        // Save document metadata to database
        const document = await createDocument({
          patient_id: patientId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          extracted_data: extractedData,
          uploaded_by: userId,
        });

        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'completed', document })}\n\n`)
        );
      } catch (error: any) {
        console.error('Upload error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'error', message: error?.message || 'Upload failed' })}\n\n`)
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

async function extractDocumentData(file: File, documentType: string) {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    
    let prompt = '';
    let fileContent: any = {};

    if (file.type === 'application/pdf') {
      // For PDFs, send as data URI
      fileContent = {
        type: 'file',
        file: {
          filename: file.name,
          file_data: `data:application/pdf;base64,${base64String}`,
        },
      };

      if (documentType === 'Requisition') {
        prompt = 'Extract ICD-10 codes, doctor information (name, NPI, facility), patient demographics, and test type from this requisition form. Return as JSON with keys: icd10_codes (array), doctor_name, npi, facility, patient_name, test_type.';
      } else if (documentType === 'EOB') {
        prompt = 'Extract payment details from this EOB document: check number, payment amount, deductions, patient responsibility, CPT codes, and any remarks. Return as JSON with keys: check_number, payment_amount, deductions, patient_responsibility, cpt_codes (array), remarks.';
      } else {
        prompt = 'Extract key information from this document. Return as JSON with relevant fields.';
      }
    } else if (file.type?.startsWith('image/')) {
      // For images, send as image_url
      fileContent = {
        type: 'image_url',
        image_url: {
          url: `data:${file.type};base64,${base64String}`,
        },
      };

      if (documentType === 'Requisition') {
        prompt = 'Extract ICD-10 codes, doctor information, and test details from this image. Return as JSON.';
      } else {
        prompt = 'Extract relevant information from this image. Return as JSON.';
      }
    }

    // Call LLM API for extraction
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              fileContent,
              {
                type: 'text',
                text: prompt + ' Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.',
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response?.ok) {
      throw new Error('LLM API request failed');
    }

    const result = await response.json();
    const extractedText = result?.choices?.[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(extractedText);
    } catch (e) {
      return { raw_text: extractedText };
    }
  } catch (error) {
    console.error('Error in extractDocumentData:', error);
    return null;
  }
}
