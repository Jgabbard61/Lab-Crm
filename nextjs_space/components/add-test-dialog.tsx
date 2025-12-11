'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Test } from '@/lib/supabase/client';
import { TEST_STATUS_OPTIONS, TEST_TYPES } from '@/lib/constants';

interface AddTestDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onTestAdded: (test: Test) => void;
}

export function AddTestDialog({ open, onClose, patientId, onTestAdded }: AddTestDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Core fields only - details can be added via Edit
  const [testType, setTestType] = useState('');
  const [accessionId, setAccessionId] = useState('');
  const [dateOfService, setDateOfService] = useState('');
  const [claimStatus, setClaimStatus] = useState('Kit Shipped');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!testType || !claimStatus) {
      toast({
        title: 'Validation Error',
        description: 'Test type and status are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          test_type: testType,
          accession_id: accessionId || null,
          date_of_service: dateOfService || null,
          claim_status: claimStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create test');
      }

      const newTest = await response.json();
      onTestAdded(newTest);
      
      toast({
        title: 'Test created',
        description: 'Test has been added successfully. Click Edit to add more details.',
      });
      
      // Refresh the page data to show new test
      router.refresh();
      
      // Reset form
      setTestType('');
      setAccessionId('');
      setDateOfService('');
      setClaimStatus('Kit Shipped');
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Test</DialogTitle>
          <p className="text-sm text-gray-600">
            Create test record quickly. Use Edit to add shipping, accessioning, and billing details.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Test Type */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="test_type">Test Type *</Label>
              <Select value={testType} onValueChange={setTestType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">PCR Tests</div>
                  {TEST_TYPES.filter(t => t.category === 'PCR').map((test) => (
                    <SelectItem key={test.value} value={test.value}>
                      {test.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1 pt-2">Genetics Tests</div>
                  {TEST_TYPES.filter(t => t.category === 'Genetics').map((test) => (
                    <SelectItem key={test.value} value={test.value}>
                      {test.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Accession ID */}
            <div className="space-y-2">
              <Label htmlFor="accession_id">Accession ID</Label>
              <Input
                id="accession_id"
                value={accessionId}
                onChange={(e) => setAccessionId(e.target.value)}
                placeholder="G001"
                disabled={loading}
              />
            </div>

            {/* Date of Service */}
            <div className="space-y-2">
              <Label htmlFor="date_of_service">Date of Collection</Label>
              <Input
                id="date_of_service"
                type="date"
                value={dateOfService}
                onChange={(e) => setDateOfService(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="claim_status">Status *</Label>
              <Select value={claimStatus} onValueChange={setClaimStatus} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Test
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
