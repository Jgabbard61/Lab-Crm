
'use client';

import { useState } from 'react';
import { Document } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';

interface PatientDocumentsProps {
  patientId: string;
  documents: Document[];
  onDocumentsUpdate: (documents: Document[]) => void;
}

export function PatientDocuments({ patientId, documents, onDocumentsUpdate }: PatientDocumentsProps) {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDocumentAdded = (newDocument: Document) => {
    onDocumentsUpdate([newDocument, ...documents]);
    setShowUploadDialog(false);
  };

  const handleDownload = async (document: Document) => {
    try {
      // Get signed URL for download
      const response = await fetch(`/api/documents/${document?.id}/download`);
      
      if (!response?.ok) throw new Error('Failed to get download URL');
      
      const { url } = await response?.json();
      
      // Trigger download
      const link = window.document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = document?.file_name ?? 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      toast({
        title: 'Download started',
        description: 'Your document download has started.',
      });
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error?.message || 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response?.ok) throw new Error('Failed to delete document');

      onDocumentsUpdate(documents?.filter((doc) => doc?.id !== documentId) ?? []);
      
      toast({
        title: 'Document deleted',
        description: 'Document has been deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getDocumentIcon = (mimeType?: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-gray-600 mt-1">Manage patient documents and uploads</p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {documents?.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No documents uploaded yet</p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents?.map((document) => (
            <Card key={document?.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getDocumentIcon(document?.mime_type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{document?.file_name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                          <Badge variant="outline">{document?.document_type}</Badge>
                          {document?.uploaded_at && (
                            <span>
                              Uploaded {format(new Date(document?.uploaded_at), 'MMM d, yyyy')}
                            </span>
                          )}
                          {document?.file_size && (
                            <span>
                              {(Number(document?.file_size) / 1024)?.toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {document?.extracted_data && (
                      <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                        <p className="text-sm font-medium text-teal-800 mb-1">Extracted Data:</p>
                        <pre className="text-xs text-teal-700 whitespace-pre-wrap">
                          {JSON.stringify(document?.extracted_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(document?.id)}
                      disabled={deletingId === document?.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deletingId === document?.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <UploadDocumentDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        patientId={patientId}
        onDocumentAdded={handleDocumentAdded}
      />
    </div>
  );
}
