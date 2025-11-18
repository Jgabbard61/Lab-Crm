
'use client';

import { useState } from 'react';
import { Test } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Calendar, FileText, Edit } from 'lucide-react';
import { AddTestDialog } from '@/components/add-test-dialog';
import { format } from 'date-fns';

interface PatientTestsProps {
  patientId: string;
  tests: Test[];
  onTestsUpdate: (tests: Test[]) => void;
}

export function PatientTests({ patientId, tests, onTestsUpdate }: PatientTestsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleTestAdded = (newTest: Test) => {
    onTestsUpdate([newTest, ...tests]);
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tests & Claims</h2>
          <p className="text-gray-600 mt-1">Manage patient tests and claim information</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Test
        </Button>
      </div>

      {tests?.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No tests recorded yet</p>
            <Button
              onClick={() => setShowAddDialog(true)}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Test
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tests?.map((test) => (
            <Card key={test?.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{test?.test_type}</CardTitle>
                    {test?.accession_id && (
                      <p className="text-sm text-gray-500 mt-1">
                        Accession: {test?.accession_id}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      test?.claim_status === 'Finalized'
                        ? 'default'
                        : test?.claim_status === 'Denied'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {test?.claim_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {test?.date_of_service && (
                    <div>
                      <p className="text-sm text-gray-500">Date of Service</p>
                      <p className="text-base font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {format(new Date(test?.date_of_service), 'MM/dd/yyyy')}
                      </p>
                    </div>
                  )}
                  {test?.charges !== null && test?.charges !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Charges</p>
                      <p className="text-base font-medium flex items-center gap-1 text-gray-900">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {Number(test?.charges)?.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {test?.paid !== null && test?.paid !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Paid</p>
                      <p className="text-base font-medium flex items-center gap-1 text-green-600">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        {Number(test?.paid)?.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {test?.patient_responsibility !== null && test?.patient_responsibility !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Patient Responsibility</p>
                      <p className="text-base font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {Number(test?.patient_responsibility)?.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {test?.claim_number && (
                    <div>
                      <p className="text-sm text-gray-500">Claim Number</p>
                      <p className="text-base font-medium">{test?.claim_number}</p>
                    </div>
                  )}
                  {test?.check_eft_number && (
                    <div>
                      <p className="text-sm text-gray-500">Check/EFT Number</p>
                      <p className="text-base font-medium">{test?.check_eft_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddTestDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        patientId={patientId}
        onTestAdded={handleTestAdded}
      />
    </div>
  );
}
