
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/lib/supabase/client';

interface PatientFormProps {
  patient?: Patient;
  isEdit?: boolean;
}

export function PatientForm({ patient, isEdit }: PatientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: patient?.first_name || '',
    last_name: patient?.last_name || '',
    gender: patient?.gender || '',
    date_of_birth: patient?.date_of_birth || '',
    address: patient?.address || '',
    medicare_id: patient?.medicare_id || '',
    insurance_payer: patient?.insurance_payer || '',
    policy_number: patient?.policy_number || '',
    icd10_codes: patient?.icd10_codes?.join(', ') || '',
    referring_physician: patient?.referring_physician || '',
    npi_number: patient?.npi_number || '',
    clinic_facility: patient?.clinic_facility || '',
    sales_rep: patient?.sales_rep || '',
    fax: patient?.fax || '',
    comments: patient?.comments || '',
    jg_comments: patient?.jg_comments || '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const icd10Array = formData?.icd10_codes
        ?.split(',')
        ?.map((code) => code?.trim())
        ?.filter(Boolean) ?? [];

      const payload = {
        ...formData,
        icd10_codes: icd10Array,
      };

      const endpoint = isEdit ? `/api/patients/${patient?.id}` : '/api/patients';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response?.ok) {
        const error = await response?.json();
        throw new Error(error?.message || 'Failed to save patient');
      }

      const result = await response?.json();

      toast({
        title: isEdit ? 'Patient updated' : 'Patient created',
        description: isEdit
          ? 'Patient profile has been updated successfully.'
          : 'New patient profile has been created successfully.',
      });

      router.push(`/dashboard/patients/${result?.data?.id}`);
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save patient',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData?.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData?.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData?.gender} onValueChange={(value) => handleChange('gender', value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData?.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData?.address}
              onChange={(e) => handleChange('address', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Insurance Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Insurance Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicare_id">Medicare ID</Label>
                <Input
                  id="medicare_id"
                  value={formData?.medicare_id}
                  onChange={(e) => handleChange('medicare_id', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_payer">Insurance Payer</Label>
                <Input
                  id="insurance_payer"
                  value={formData?.insurance_payer}
                  onChange={(e) => handleChange('insurance_payer', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="policy_number">Policy Number</Label>
              <Input
                id="policy_number"
                value={formData?.policy_number}
                onChange={(e) => handleChange('policy_number', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
            <div className="space-y-2">
              <Label htmlFor="icd10_codes">ICD-10 Codes (comma-separated)</Label>
              <Input
                id="icd10_codes"
                value={formData?.icd10_codes}
                onChange={(e) => handleChange('icd10_codes', e.target.value)}
                placeholder="e.g., A01.0, B02.9, C50.911"
                disabled={loading}
              />
            </div>
          </div>

          {/* Physician and Facility */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Physician & Facility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referring_physician">Referring Physician</Label>
                <Input
                  id="referring_physician"
                  value={formData?.referring_physician}
                  onChange={(e) => handleChange('referring_physician', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npi_number">NPI Number</Label>
                <Input
                  id="npi_number"
                  value={formData?.npi_number}
                  onChange={(e) => handleChange('npi_number', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="clinic_facility">Clinic/Facility</Label>
                <Input
                  id="clinic_facility"
                  value={formData?.clinic_facility}
                  onChange={(e) => handleChange('clinic_facility', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sales_rep">Sales Rep</Label>
                <Input
                  id="sales_rep"
                  value={formData?.sales_rep}
                  onChange={(e) => handleChange('sales_rep', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={formData?.fax}
                onChange={(e) => handleChange('fax', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Comments */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData?.comments}
                  onChange={(e) => handleChange('comments', e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jg_comments">JG Comments</Label>
                <Textarea
                  id="jg_comments"
                  value={formData?.jg_comments}
                  onChange={(e) => handleChange('jg_comments', e.target.value)}
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Update Patient' : 'Create Patient'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
