
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Test } from '@/lib/supabase/client';

interface AddTestDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onTestAdded: (test: Test) => void;
}

const TEST_TYPES = [
  'Immunodeficiency',
  'Eye Disorder',
  'CGx',
  'UTI',
  'GI',
  'PGX',
  'Thyroid',
  'Cardio Pulmonary',
  'Neuro',
];

export function AddTestDialog({ open, onClose, patientId, onTestAdded }: AddTestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    test_type: '',
    accession_id: '',
    date_of_service: '',
    result_in_date: '',
    result_fax_date: '',
    claim_status: 'Pending',
    billed_date: '',
    claim_number: '',
    charges: '',
    paid: '',
    ded_coins: '',
    patient_responsibility: '',
    check_eft_number: '',
    check_eft_date: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        patient_id: patientId,
        test_type: formData?.test_type,
        accession_id: formData?.accession_id || null,
        date_of_service: formData?.date_of_service || null,
        result_in_date: formData?.result_in_date || null,
        result_fax_date: formData?.result_fax_date || null,
        claim_status: formData?.claim_status,
        billed_date: formData?.billed_date || null,
        claim_number: formData?.claim_number || null,
        charges: formData?.charges ? parseFloat(formData?.charges) : null,
        paid: formData?.paid ? parseFloat(formData?.paid) : null,
        ded_coins: formData?.ded_coins ? parseFloat(formData?.ded_coins) : null,
        patient_responsibility: formData?.patient_responsibility ? parseFloat(formData?.patient_responsibility) : null,
        check_eft_number: formData?.check_eft_number || null,
        check_eft_date: formData?.check_eft_date || null,
      };

      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.message || 'Failed to add test');
      }

      const result = await response?.json();

      toast({
        title: 'Test added',
        description: 'Test has been added successfully.',
      });

      onTestAdded(result?.data);
      
      // Reset form
      setFormData({
        test_type: '',
        accession_id: '',
        date_of_service: '',
        result_in_date: '',
        result_fax_date: '',
        claim_status: 'Pending',
        billed_date: '',
        claim_number: '',
        charges: '',
        paid: '',
        ded_coins: '',
        patient_responsibility: '',
        check_eft_number: '',
        check_eft_date: '',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add test',
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_type">Test Type *</Label>
              <Select
                value={formData?.test_type}
                onValueChange={(value) => handleChange('test_type', value)}
                required
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accession_id">Accession ID</Label>
              <Input
                id="accession_id"
                value={formData?.accession_id}
                onChange={(e) => handleChange('accession_id', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_service">Date of Service</Label>
              <Input
                id="date_of_service"
                type="date"
                value={formData?.date_of_service}
                onChange={(e) => handleChange('date_of_service', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim_status">Claim Status</Label>
              <Select
                value={formData?.claim_status}
                onValueChange={(value) => handleChange('claim_status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Finalized">Finalized</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="charges">Charges</Label>
              <Input
                id="charges"
                type="number"
                step="0.01"
                value={formData?.charges}
                onChange={(e) => handleChange('charges', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid">Paid</Label>
              <Input
                id="paid"
                type="number"
                step="0.01"
                value={formData?.paid}
                onChange={(e) => handleChange('paid', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient_responsibility">Patient Responsibility</Label>
              <Input
                id="patient_responsibility"
                type="number"
                step="0.01"
                value={formData?.patient_responsibility}
                onChange={(e) => handleChange('patient_responsibility', e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="claim_number">Claim Number</Label>
              <Input
                id="claim_number"
                value={formData?.claim_number}
                onChange={(e) => handleChange('claim_number', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

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
                  Adding...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Test
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
