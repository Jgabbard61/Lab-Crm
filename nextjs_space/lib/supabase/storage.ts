
// Supabase Storage Helpers for Document Management
import { supabase } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'patient-documents';

// =====================================================
// SECURITY HELPERS
// =====================================================

/**
 * ✅ SECURITY FIX: Sanitize filename to prevent path traversal attacks
 * Removes dangerous characters and patterns like ../, ..\, etc.
 */
function sanitizeFilename(filename: string): string {
  // Remove any path components (../  ..\ / \)
  let sanitized = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '');

  // Remove null bytes and other dangerous characters
  sanitized = sanitized.replace(/\0/g, '').replace(/[<>:"|?*]/g, '');

  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized.trim().length === 0) {
    return 'unnamed-file';
  }

  return sanitized.trim();
}

/**
 * ✅ SECURITY FIX: Validate and sanitize path component (patientId, documentType)
 */
function sanitizePathComponent(component: string): string {
  // Remove path traversal attempts and dangerous characters
  return component
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

// =====================================================
// STORAGE UPLOAD/DOWNLOAD/DELETE
// =====================================================

/**
 * Upload a document to Supabase Storage
 * @param file - File to upload
 * @param patientId - Patient ID for folder organization
 * @param documentType - Document type for categorization
 * @param authenticatedClient - Optional authenticated Supabase client (required for server-side uploads)
 */
export async function uploadDocument(
  file: File,
  patientId: string,
  documentType: string,
  authenticatedClient?: SupabaseClient
): Promise<{ path: string; url: string }> {
  const client = authenticatedClient || supabase;

  // ✅ SECURITY FIX: Sanitize all path components to prevent path traversal
  const safePatientId = sanitizePathComponent(patientId);
  const safeDocumentType = sanitizePathComponent(documentType);
  const safeOriginalName = sanitizeFilename(file.name);

  // Extract file extension safely (take last part after final dot)
  const parts = safeOriginalName.split('.');
  const fileExt = parts.length > 1 ? parts[parts.length - 1] : 'bin';

  // Construct safe file path with sanitized components
  const fileName = `${safePatientId}/${safeDocumentType}/${Date.now()}.${fileExt}`;

  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL (or signed URL for private buckets)
  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

export async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);
  
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadDocument(filePath: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(filePath);
  
  if (error) throw error;
  return data;
}

export async function deleteDocument(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);
  
  if (error) throw error;
}

export async function listDocuments(patientId: string): Promise<any[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(patientId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });
  
  if (error) throw error;
  return data;
}
