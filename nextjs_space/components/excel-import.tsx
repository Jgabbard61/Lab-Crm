
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PreviewRow {
  row_number: number;
  data: any;
  match_status: 'new' | 'existing' | 'update';
  patient_name?: string;
  errors?: string[];
}

export function ExcelImportComponent() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target?.files && e.target?.files?.length > 0) {
      setFile(e.target?.files?.[0] ?? null);
      setPreview(null);
      setImportResults(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.message || 'Failed to preview file');
      }

      const result = await response?.json();
      setPreview(result?.preview);

      toast({
        title: 'Preview generated',
        description: `Found ${result?.preview?.length ?? 0} rows to import.`,
      });
    } catch (error: any) {
      toast({
        title: 'Preview failed',
        description: error?.message || 'Failed to preview file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/execute', {
        method: 'POST',
        body: formData,
      });

      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.message || 'Failed to import file');
      }

      const result = await response?.json();
      setImportResults(result);

      toast({
        title: 'Import completed',
        description: `Successfully imported ${result?.successful_rows ?? 0} of ${result?.total_rows ?? 0} rows.`,
      });

      // Reset
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error?.message || 'Failed to import file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
            <input
              type="file"
              id="excel-file"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={loading}
            />
            <label htmlFor="excel-file" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-12 w-12 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file?.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file?.size / 1024)?.toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-16 w-16 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">Click to select Excel file</p>
                    <p className="text-sm text-gray-500">XLSX, XLS, or CSV format</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          {file && !preview && (
            <Button
              onClick={handlePreview}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Preview Import'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && !importResults && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Import Preview</CardTitle>
              <div className="flex gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  {preview?.filter((r) => r?.match_status === 'new')?.length ?? 0} New
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-blue-600" />
                  {preview?.filter((r) => r?.match_status === 'existing')?.length ?? 0} Existing
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-orange-600" />
                  {preview?.filter((r) => r?.match_status === 'update')?.length ?? 0} Updates
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {preview?.slice(0, 20)?.map((row) => (
                <div
                  key={row?.row_number}
                  className={`p-3 rounded-lg border ${
                    row?.match_status === 'new'
                      ? 'bg-green-50 border-green-200'
                      : row?.match_status === 'update'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {row?.patient_name || 'Unknown Patient'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Row {row?.row_number}: {row?.match_status === 'new' ? 'New patient' : row?.match_status === 'update' ? 'Will update existing' : 'Already exists'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        row?.match_status === 'new'
                          ? 'default'
                          : row?.match_status === 'update'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {row?.match_status}
                    </Badge>
                  </div>
                  {row?.errors && row?.errors?.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {row?.errors?.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(preview?.length ?? 0) > 20 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Showing first 20 of {preview?.length} rows
              </p>
            )}

            <Button
              onClick={handleImport}
              className="w-full mt-6 bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Confirm Import'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults && (
        <Card className="border-teal-500">
          <CardHeader>
            <CardTitle className="text-teal-700">Import Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-700">
                  {importResults?.successful_rows ?? 0}
                </p>
                <p className="text-sm text-gray-600">Successful</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-700">
                  {importResults?.failed_rows ?? 0}
                </p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-gray-700">
                  {importResults?.total_rows ?? 0}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>

            {importResults?.errors && importResults?.errors?.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="font-medium text-red-800 mb-2">Errors:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults?.errors?.slice(0, 10)?.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={() => {
                setImportResults(null);
                setFile(null);
              }}
              variant="outline"
              className="w-full mt-4"
            >
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Expected Headers Info */}
      <Card>
        <CardHeader>
          <CardTitle>Expected Excel Headers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
            {[
              'Accession', 'Claim Status', 'Test/Modality', 'DOS(COLLECTION)',
              'First Name', 'Last Name', 'Gender', 'Date of Birth',
              'Address', 'ICD-10 Code', 'Result-In Date', 'Result Fax Date',
              'Ref Physician', 'NPI#', 'Clinic/Facility/Ref Lab', 'Sales Rep',
              'Insurance', 'Policy', 'Comments', 'Billed Date',
              'Claim', 'Charges', 'Paid', 'Ded/Coins',
              'Patient Responsibility', 'Check/EFT#', 'Check/EFT Date', 'JG Comments',
              'MR', 'Payment #', 'Payment Date', 'Correction/Requests',
              'Deductible', 'Fax'
            ]?.map((header) => (
              <Badge key={header} variant="outline" className="justify-center">
                {header}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            The system will automatically detect and map these headers. Patient matching is done by Last Name + Date of Birth to prevent duplicates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
