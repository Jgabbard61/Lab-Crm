
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/lib/supabase/client';

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onDocumentAdded: (document: Document) => void;
}

const DOCUMENT_TYPES = [
  'Lab Result',
  'EOB',
  'Prior Authorization',
  'Requisition',
];

const DOCUMENT_CATEGORIES = [
  'Results',
  'EOBs',
  'Denials',
  'Payments',
  'Insurance Correspondence',
];

export function UploadDocumentDialog({ open, onClose, patientId, onDocumentAdded }: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentCategory, setDocumentCategory] = useState('Results');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target?.files && e.target?.files?.length > 0) {
      setFile(e.target?.files?.[0] ?? null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !documentType || !documentCategory) {
      toast({
        title: 'Missing information',
        description: 'Please select a document type, category, and file',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setProgress('Uploading document...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', patientId);
      formData.append('document_type', documentType);
      formData.append('document_category', documentCategory);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.message || 'Failed to upload document');
      }

      // Handle streaming response for AI/OCR progress
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = (await reader?.read()) ?? { done: true, value: undefined };
        if (done) break;

        const chunk = decoder?.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer?.split('\n');
        buffer = lines?.pop() ?? '';

        for (const line of lines) {
          if (line?.startsWith('data: ')) {
            const data = line?.slice(6);
            try {
              const parsed = JSON.parse(data);
              
              if (parsed?.status === 'processing') {
                setProgress(parsed?.message || 'Processing...');
              } else if (parsed?.status === 'completed') {
                onDocumentAdded(parsed?.document);
                
                toast({
                  title: 'Document uploaded',
                  description: 'Document has been uploaded successfully.',
                });
                
                // Reset form
                setFile(null);
                setDocumentType('');
                setDocumentCategory('Results');
                onClose();
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message || 'Upload failed');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="document_type">Document Type *</Label>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
              required
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES?.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document_category">Category *</Label>
            <Select
              value={documentCategory}
              onValueChange={setDocumentCategory}
              required
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES?.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the appropriate folder for this document
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-500 transition-colors">
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                required
                disabled={loading}
              />
              <label htmlFor="file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-teal-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file?.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file?.size / 1024)?.toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">Click to select a file</p>
                    <p className="text-xs text-gray-500">PDF, PNG, or JPG (max 50MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {loading && progress && (
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-800 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress}
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
