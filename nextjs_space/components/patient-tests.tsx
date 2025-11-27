'use client';

import { useState } from 'react';
import { Test } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, Edit, DollarSign, Calendar, FileText, Package, 
  CheckCircle, XCircle, Truck, Beaker, ExternalLink
} from 'lucide-react';
import { AddTestDialog } from './add-test-dialog';
import { EditTestDialog } from './edit-test-dialog';
import { TestNotes } from './test-notes';
import { format } from 'date-fns';
import { getStatusColor, getFedExTrackingUrl, getAccessioningStatusColor } from '@/lib/constants';

interface PatientTestsProps {
  patientId: string;
  tests: Test[];
  onTestsUpdate: (tests: Test[]) => void;
}

export function PatientTests({ patientId, tests, onTestsUpdate }: PatientTestsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const handleTestAdded = (newTest: Test) => {
    onTestsUpdate([...tests, newTest]);
    setShowAddDialog(false);
  };

  const handleTestUpdated = (updatedTest: Test) => {
    onTestsUpdate(
      tests.map((test) => (test.id === updatedTest.id ? updatedTest : test))
    );
    setEditingTest(null);
  };

  const openTrackingUrl = (trackingNumber: string) => {
    window.open(getFedExTrackingUrl(trackingNumber), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tests & Claims</h2>
          <p className="text-gray-600 mt-1">Complete workflow tracking from kit shipment to payment</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No tests recorded yet</p>
              <p className="text-gray-500 mb-6">
                Add the first test to start tracking the complete workflow
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Test
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      🧬 {test.test_type}
                      <Badge className={getStatusColor(test.claim_status)}>
                        {test.claim_status}
                      </Badge>
                    </CardTitle>
                    {test.accession_id && (
                      <p className="text-sm text-gray-600">
                        Accession: <span className="font-mono font-semibold">{test.accession_id}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTest(test)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Main Dates */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                  <div>
                    <p className="text-sm text-gray-600">Date of Collection</p>
                    <p className="font-semibold">
                      {test.date_of_service
                        ? format(new Date(test.date_of_service), 'MMM d, yyyy')
                        : 'Not recorded'}
                    </p>
                  </div>
                  {test.date_reported && (
                    <div>
                      <p className="text-sm text-gray-600">Date Reported</p>
                      <p className="font-semibold">
                        {format(new Date(test.date_reported), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Collapsible Sections */}
                <Accordion type="multiple" className="w-full">
                  {/* Shipping & Tracking */}
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Shipping & Tracking</span>
                        {test.kit_shipment_status && (
                          <Badge variant="outline" className="ml-2">
                            {test.kit_shipment_status}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {test.kit_shipped_date && (
                          <div>
                            <p className="text-sm text-gray-600">Kit Shipped</p>
                            <p className="font-medium">
                              {format(new Date(test.kit_shipped_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {test.kit_shipment_tracking && (
                          <div>
                            <p className="text-sm text-gray-600">Shipment TO Patient</p>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-blue-600"
                              onClick={() => openTrackingUrl(test.kit_shipment_tracking!)}
                            >
                              {test.kit_shipment_tracking}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                        {test.kit_return_tracking && (
                          <div>
                            <p className="text-sm text-gray-600">Return FROM Patient</p>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-mono text-blue-600"
                              onClick={() => openTrackingUrl(test.kit_return_tracking!)}
                            >
                              {test.kit_return_tracking}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        )}
                        {test.kit_received_date && (
                          <div>
                            <p className="text-sm text-gray-600">Kit Received at Lab</p>
                            <p className="font-medium">
                              {format(new Date(test.kit_received_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Accessioning */}
                  <AccordionItem value="accessioning">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Accessioning / QC</span>
                        {test.accessioning_status && (
                          <Badge className={getAccessioningStatusColor(test.accessioning_status)}>
                            {test.accessioning_status}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {test.accessioning_date && (
                          <div>
                            <p className="text-sm text-gray-600">Accessioning Date</p>
                            <p className="font-medium">
                              {format(new Date(test.accessioning_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {test.accessioning_notes && (
                          <div>
                            <p className="text-sm text-gray-600">QC Notes</p>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded border">
                              {test.accessioning_notes}
                            </p>
                          </div>
                        )}
                        {!test.accessioning_status && !test.accessioning_date && (
                          <p className="text-gray-500 italic">No accessioning data recorded</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Lab Processing */}
                  <AccordionItem value="lab">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold">Lab Processing</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {test.sent_to_lab_date && (
                          <div>
                            <p className="text-sm text-gray-600">Sent to Lab</p>
                            <p className="font-medium">
                              {format(new Date(test.sent_to_lab_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {test.results_received_date && (
                          <div>
                            <p className="text-sm text-gray-600">Results Received</p>
                            <p className="font-medium">
                              {format(new Date(test.results_received_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        )}
                        {!test.sent_to_lab_date && !test.results_received_date && (
                          <p className="text-gray-500 italic col-span-2">No lab processing data recorded</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Billing & Payment */}
                  <AccordionItem value="billing">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Billing & Payment</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-sm text-gray-600">Charges</p>
                          <p className="font-semibold text-lg">
                            ${test.charges?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Paid Amount</p>
                          <p className="font-semibold text-lg text-green-600">
                            ${test.paid?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Patient Responsibility</p>
                          <p className="font-medium">
                            ${test.patient_responsibility?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ded/CoIns</p>
                          <p className="font-medium">
                            ${test.ded_coins?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Notes & Comments */}
                  <AccordionItem value="notes">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold">Notes & Comments</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2">
                        <TestNotes testId={test.id} patientId={patientId} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddTestDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        patientId={patientId}
        onTestAdded={handleTestAdded}
      />

      {editingTest && (
        <EditTestDialog
          open={true}
          onClose={() => setEditingTest(null)}
          test={editingTest}
          onTestUpdated={handleTestUpdated}
        />
      )}
    </div>
  );
}
