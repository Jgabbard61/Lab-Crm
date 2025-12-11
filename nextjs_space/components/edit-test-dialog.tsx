'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Package, CheckCircle, Beaker, DollarSign, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Test } from '@/lib/supabase/client';
import { TEST_STATUS_OPTIONS, KIT_SHIPMENT_STATUS_OPTIONS, ACCESSIONING_STATUS_OPTIONS, BILLING_STATUS_OPTIONS, TEST_TYPES } from '@/lib/constants';

interface EditTestDialogProps {
  open: boolean;
  onClose: () => void;
  test: Test;
  onTestUpdated: (test: Test) => void;
}

export function EditTestDialog({ open, onClose, test, onTestUpdated }: EditTestDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Core fields
  const [testType, setTestType] = useState('');
  const [accessionId, setAccessionId] = useState('');
  const [dateOfService, setDateOfService] = useState('');
  const [dateReported, setDateReported] = useState('');
  const [claimStatus, setClaimStatus] = useState('');
  
  // Shipping fields
  const [kitShippedDate, setKitShippedDate] = useState('');
  const [kitShipmentTracking, setKitShipmentTracking] = useState('');
  const [kitReturnTracking, setKitReturnTracking] = useState('');
  const [kitReceivedDate, setKitReceivedDate] = useState('');
  const [kitShipmentStatus, setKitShipmentStatus] = useState('Pending');
  
  // Accessioning fields
  const [accessioningStatus, setAccessioningStatus] = useState('Pending');
  const [accessioningDate, setAccessioningDate] = useState('');
  const [accessioningNotes, setAccessioningNotes] = useState('');
  
  // Lab processing
  const [sentToLabDate, setSentToLabDate] = useState('');
  const [resultsReceivedDate, setResultsReceivedDate] = useState('');
  
  // Billing - Financial
  const [charges, setCharges] = useState('');
  const [paid, setPaid] = useState('');
  const [patientResponsibility, setPatientResponsibility] = useState('');
  const [dedCoins, setDedCoins] = useState('');

  // Billing - Workflow
  const [billingStatus, setBillingStatus] = useState('Not Billed');
  const [billingNotes, setBillingNotes] = useState('');
  const [initialBillDate, setInitialBillDate] = useState('');
  const [lastResubmitDate, setLastResubmitDate] = useState('');
  const [resubmitCount, setResubmitCount] = useState('');

  useEffect(() => {
    if (test) {
      setTestType(test.test_type || '');
      setAccessionId(test.accession_id || '');
      setDateOfService(test.date_of_service || '');
      setDateReported(test.date_reported || '');
      setClaimStatus(test.claim_status || 'Kit Shipped');
      
      setKitShippedDate(test.kit_shipped_date || '');
      setKitShipmentTracking(test.kit_shipment_tracking || '');
      setKitReturnTracking(test.kit_return_tracking || '');
      setKitReceivedDate(test.kit_received_date || '');
      setKitShipmentStatus(test.kit_shipment_status || 'Pending');
      
      setAccessioningStatus(test.accessioning_status || 'Pending');
      setAccessioningDate(test.accessioning_date || '');
      setAccessioningNotes(test.accessioning_notes || '');
      
      setSentToLabDate(test.sent_to_lab_date || '');
      setResultsReceivedDate(test.results_received_date || '');
      
      setCharges(test.charges?.toString() || '');
      setPaid(test.paid?.toString() || '');
      setPatientResponsibility(test.patient_responsibility?.toString() || '');
      setDedCoins(test.ded_coins?.toString() || '');

      setBillingStatus(test.billing_status || 'Not Billed');
      setBillingNotes(test.billing_notes || '');
      setInitialBillDate(test.initial_bill_date || '');
      setLastResubmitDate(test.last_resubmit_date || '');
      setResubmitCount(test.resubmit_count?.toString() || '0');
    }
  }, [test]);

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
      const response = await fetch(`/api/tests/${test.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: testType,
          accession_id: accessionId || null,
          date_of_service: dateOfService || null,
          date_reported: dateReported || null,
          claim_status: claimStatus,
          
          kit_shipped_date: kitShippedDate || null,
          kit_shipment_tracking: kitShipmentTracking || null,
          kit_return_tracking: kitReturnTracking || null,
          kit_received_date: kitReceivedDate || null,
          kit_shipment_status: kitShipmentStatus,
          
          accessioning_status: accessioningStatus,
          accessioning_date: accessioningDate || null,
          accessioning_notes: accessioningNotes || null,
          
          sent_to_lab_date: sentToLabDate || null,
          results_received_date: resultsReceivedDate || null,
          
          charges: charges ? parseFloat(charges) : null,
          paid: paid ? parseFloat(paid) : null,
          patient_responsibility: patientResponsibility ? parseFloat(patientResponsibility) : null,
          ded_coins: dedCoins ? parseFloat(dedCoins) : null,

          billing_status: billingStatus || null,
          billing_notes: billingNotes || null,
          initial_bill_date: initialBillDate || null,
          last_resubmit_date: lastResubmitDate || null,
          resubmit_count: resubmitCount ? parseInt(resubmitCount) : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update test');
      }

      const updatedTest = await response.json();
      onTestUpdated(updatedTest);
      
      toast({
        title: 'Test updated',
        description: 'Changes have been saved successfully.',
      });
      
      // Refresh the page data to show updated values
      router.refresh();
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update test',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/tests/${test.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete test');
      }

      toast({
        title: 'Test deleted',
        description: 'Test has been deleted successfully.',
      });

      router.refresh();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete test',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Test - {test.test_type}</DialogTitle>
          <p className="text-sm text-gray-600">
            Update complete workflow tracking from kit shipment to payment
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="shipping">
                <Package className="h-4 w-4 mr-1" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="accessioning">
                <CheckCircle className="h-4 w-4 mr-1" />
                QC
              </TabsTrigger>
              <TabsTrigger value="lab">
                <Beaker className="h-4 w-4 mr-1" />
                Lab
              </TabsTrigger>
              <TabsTrigger value="billing">
                <DollarSign className="h-4 w-4 mr-1" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Test Type *</Label>
                  <Select value={testType} onValueChange={setTestType} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">PCR Tests</div>
                      {TEST_TYPES.filter(t => t.category === 'PCR').map((testOption) => (
                        <SelectItem key={testOption.value} value={testOption.value}>
                          {testOption.label}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-1 pt-2">Genetics Tests</div>
                      {TEST_TYPES.filter(t => t.category === 'Genetics').map((testOption) => (
                        <SelectItem key={testOption.value} value={testOption.value}>
                          {testOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Accession ID</Label>
                  <Input value={accessionId} onChange={(e) => setAccessionId(e.target.value)} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={claimStatus} onValueChange={setClaimStatus} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label>Date of Collection</Label>
                  <Input type="date" value={dateOfService} onChange={(e) => setDateOfService(e.target.value)} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label>Date Reported</Label>
                  <Input type="date" value={dateReported} onChange={(e) => setDateReported(e.target.value)} disabled={loading} />
                </div>
              </div>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kit Shipped Date</Label>
                  <Input type="date" value={kitShippedDate} onChange={(e) => setKitShippedDate(e.target.value)} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label>Shipment Status</Label>
                  <Select value={kitShipmentStatus} onValueChange={setKitShipmentStatus} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KIT_SHIPMENT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shipment TO Patient (FedEx #)</Label>
                  <Input 
                    value={kitShipmentTracking} 
                    onChange={(e) => setKitShipmentTracking(e.target.value)} 
                    placeholder="123456789012"
                    disabled={loading} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Return FROM Patient (FedEx #)</Label>
                  <Input 
                    value={kitReturnTracking} 
                    onChange={(e) => setKitReturnTracking(e.target.value)} 
                    placeholder="123456789012"
                    disabled={loading} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kit Received at Lab</Label>
                  <Input type="date" value={kitReceivedDate} onChange={(e) => setKitReceivedDate(e.target.value)} disabled={loading} />
                </div>
              </div>
            </TabsContent>

            {/* Accessioning Tab */}
            <TabsContent value="accessioning" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Accessioning Status</Label>
                  <Select value={accessioningStatus} onValueChange={setAccessioningStatus} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESSIONING_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Accessioning Date</Label>
                  <Input type="date" value={accessioningDate} onChange={(e) => setAccessioningDate(e.target.value)} disabled={loading} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Accessioning Notes</Label>
                  <Textarea
                    value={accessioningNotes}
                    onChange={(e) => setAccessioningNotes(e.target.value)}
                    placeholder="QC notes, rejection reasons (e.g., sample spilled, leaked, incorrectly swabbed, etc.)..."
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Lab Processing Tab */}
            <TabsContent value="lab" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sent to Lab Date</Label>
                  <Input type="date" value={sentToLabDate} onChange={(e) => setSentToLabDate(e.target.value)} disabled={loading} />
                </div>

                <div className="space-y-2">
                  <Label>Results Received Date</Label>
                  <Input type="date" value={resultsReceivedDate} onChange={(e) => setResultsReceivedDate(e.target.value)} disabled={loading} />
                </div>
              </div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6 pt-4">
              {/* Billing Workflow Status */}
              <div className="space-y-4 pb-4 border-b">
                <h3 className="font-semibold text-gray-900">Billing Workflow</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Billing Status *</Label>
                    <Select value={billingStatus} onValueChange={setBillingStatus} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">Track the current status of the billing process</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Initial Bill Date</Label>
                    <Input
                      type="date"
                      value={initialBillDate}
                      onChange={(e) => setInitialBillDate(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Last Resubmit Date</Label>
                    <Input
                      type="date"
                      value={lastResubmitDate}
                      onChange={(e) => setLastResubmitDate(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Resubmit Count</Label>
                    <Input
                      type="number"
                      value={resubmitCount}
                      onChange={(e) => setResubmitCount(e.target.value)}
                      placeholder="0"
                      disabled={loading}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Billing Notes</Label>
                    <Textarea
                      value={billingNotes}
                      onChange={(e) => setBillingNotes(e.target.value)}
                      placeholder="Add notes about billing issues, resubmission reasons, insurance correspondence, etc..."
                      rows={4}
                      disabled={loading}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500">Document billing issues, denial reasons, resubmission details</p>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Financial Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Charges</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Paid Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paid}
                      onChange={(e) => setPaid(e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Patient Responsibility</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={patientResponsibility}
                      onChange={(e) => setPatientResponsibility(e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ded/CoIns</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={dedCoins}
                      onChange={(e) => setDedCoins(e.target.value)}
                      placeholder="0.00"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Test
                </>
              )}
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading || deleting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
