
'use client';

import { useState } from 'react';
import { Patient, Test } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Eye, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface PatientWithTests extends Patient {
  tests?: Test[];
}

interface PatientTableProps {
  patients: PatientWithTests[];
}

export function PatientTable({ patients }: PatientTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients?.filter((patient) =>
    patient?.last_name?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '') ||
    patient?.first_name?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '') ||
    patient?.medicare_id?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '')
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by last name, first name, or Medicare ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Link href="/dashboard/patients/new">
          <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Patient
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {filteredPatients?.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No patients found</p>
            </div>
          </Card>
        ) : (
          filteredPatients?.map((patient) => (
            <Card
              key={patient?.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <Link href={`/dashboard/patients/${patient?.id}`}>
                <div className="flex flex-col lg:flex-row gap-6 justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient?.last_name}, {patient?.first_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {patient?.gender && (
                            <span>{patient?.gender}</span>
                          )}
                          {patient?.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(patient?.date_of_birth), 'MM/dd/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {patient?.medicare_id && (
                        <div>
                          <span className="text-gray-500">Medicare ID:</span>{' '}
                          <span className="font-medium text-gray-900">{patient?.medicare_id}</span>
                        </div>
                      )}
                      {patient?.insurance_payer && (
                        <div>
                          <span className="text-gray-500">Insurance:</span>{' '}
                          <span className="font-medium text-gray-900">{patient?.insurance_payer}</span>
                        </div>
                      )}
                      {patient?.referring_physician && (
                        <div>
                          <span className="text-gray-500">Physician:</span>{' '}
                          <span className="font-medium text-gray-900">{patient?.referring_physician}</span>
                        </div>
                      )}
                      {patient?.clinic_facility && (
                        <div>
                          <span className="text-gray-500">Facility:</span>{' '}
                          <span className="font-medium text-gray-900">{patient?.clinic_facility}</span>
                        </div>
                      )}
                    </div>

                    {patient?.tests && patient?.tests?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {patient?.tests?.map((test) => (
                          <Badge
                            key={test?.id}
                            variant={
                              test?.claim_status === 'Finalized'
                                ? 'default'
                                : test?.claim_status === 'Denied'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {test?.test_type} - {test?.claim_status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/patients/${patient?.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          ))
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredPatients?.length} of {patients?.length} patients
      </div>
    </div>
  );
}
