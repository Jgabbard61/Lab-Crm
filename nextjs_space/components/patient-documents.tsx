
'use client';

import { useState, useMemo } from 'react';
import { Document } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Download, Trash2, Loader2, Eye, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { UploadDocumentDialog } from '@/components/upload-document-dialog';
import { DOCUMENT_CATEGORIES } from '@/lib/constants';

interface PatientDocumentsProps {
  patientId: string;
  documents: Document[];
  onDocumentsUpdate: (documents: Document[]) => void;
}

export function PatientDocuments({ patientId, documents, onDocumentsUpdate }: PatientDocumentsProps) {
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter documents by category
  const filteredDocuments = useMemo(() => {
    if (categoryFilter === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.document_category === categoryFilter);
  }, [documents, categoryFilter]);

  // Count documents by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    DOCUMENT_CATEGORIES.forEach(cat => {
      counts[cat.value] = documents.filter(doc => doc.document_category === cat.value).length;
    });
    return counts;
  }, [documents]);

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

  const handleView = async (document: Document) => {
    try {
      // Get signed URL for viewing
      const response = await fetch(`/api/documents/${document?.id}/download`);
      
      if (!response?.ok) throw new Error('Failed to get document URL');
      
      const { url } = await response?.json();
      
      // Open in new tab
      window.open(url, '_blank');
      
      toast({
        title: 'Opening document',
        description: 'Document is opening in a new tab.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to open document',
        description: error?.message || 'Could not open document',
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

  const getCategoryBadge = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find(c => c.value === category);
    if (!cat) return null;
    return (
      <Badge className={cat.color}>
        <span className="mr-1">{cat.icon}</span>
        {cat.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-gray-600 mt-1">Upload and manage patient documents</p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
          className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filter Section */}
      <div className="flex items-center gap-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Documents ({documents.length})
            </SelectItem>
            {DOCUMENT_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <span className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <span className="text-gray-500">({categoryCounts[category.value] || 0})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categoryFilter !== 'all' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              {categoryFilter === 'all' ? 'No documents uploaded yet' : 'No documents in this category'}
            </p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document?.id} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="text-2xl">{getDocumentIcon(document?.mime_type)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{document?.file_name}</div>
                  </TableCell>
                  <TableCell>
                    {document?.document_category && getCategoryBadge(document?.document_category)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {(document as any)?.uploader?.full_name || (document as any)?.uploader?.username || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {document?.uploaded_at && format(new Date(document?.uploaded_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {document?.file_size && `${(Number(document?.file_size) / 1024)?.toFixed(1)} KB`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(document)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document?.id)}
                        disabled={deletingId === document?.id}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        {deletingId === document?.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
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