
'use client';

import { Patient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Calendar, MapPin, Phone, Building, User, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface PatientOverviewProps {
  patient: Patient;
}

export function PatientOverview({ patient }: PatientOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {patient?.status && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Claim Status:</span>
              <Badge
                variant={
                  patient?.status === 'Paid in Full'
                    ? 'default'
                    : patient?.status === 'Denied'
                    ? 'destructive'
                    : patient?.status === 'Claim Received' || patient?.status === 'Billed'
                    ? 'secondary'
                    : 'outline'
                }
                className="text-sm px-3 py-1"
              >
                {patient?.status}
              </Badge>
            </div>
          )}
        </div>
        <Link href={`/dashboard/patients/${patient?.id}/edit`}>
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Patient
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="text-base font-medium">
                {patient?.first_name} {patient?.last_name}
              </p>
            </div>
            {patient?.gender && (
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="text-base font-medium">{patient?.gender}</p>
              </div>
            )}
            {patient?.date_of_birth && (
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {format(new Date(patient?.date_of_birth), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            {patient?.address && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {patient?.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              Insurance Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient?.medicare_id && (
              <div>
                <p className="text-sm text-gray-500">Medicare ID</p>
                <p className="text-base font-medium">{patient?.medicare_id}</p>
              </div>
            )}
            {patient?.insurance_payer && (
              <div>
                <p className="text-sm text-gray-500">Insurance Payer</p>
                <p className="text-base font-medium">{patient?.insurance_payer}</p>
              </div>
            )}
            {patient?.policy_number && (
              <div>
                <p className="text-sm text-gray-500">Policy Number</p>
                <p className="text-base font-medium">{patient?.policy_number}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Information */}
        {patient?.icd10_codes && patient?.icd10_codes?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-teal-600" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">ICD-10 Codes</p>
                <div className="flex flex-wrap gap-2">
                  {patient?.icd10_codes?.map((code, index) => (
                    <Badge key={index} variant="secondary">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Physician and Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-teal-600" />
              Physician & Facility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient?.referring_physician && (
              <div>
                <p className="text-sm text-gray-500">Referring Physician</p>
                <p className="text-base font-medium">{patient?.referring_physician}</p>
              </div>
            )}
            {patient?.npi_number && (
              <div>
                <p className="text-sm text-gray-500">NPI Number</p>
                <p className="text-base font-medium">{patient?.npi_number}</p>
              </div>
            )}
            {(patient?.reference_laboratory || patient?.clinic_facility) && (
              <div>
                <p className="text-sm text-gray-500">Reference Laboratory</p>
                <p className="text-base font-medium">{patient?.reference_laboratory || patient?.clinic_facility}</p>
              </div>
            )}
            {patient?.sales_rep && (
              <div>
                <p className="text-sm text-gray-500">Sales Rep</p>
                <p className="text-base font-medium">{patient?.sales_rep}</p>
              </div>
            )}
            {patient?.fax && (
              <div>
                <p className="text-sm text-gray-500">Fax</p>
                <p className="text-base font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {patient?.fax}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      {(patient?.comments || patient?.jg_comments) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patient?.comments && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Comments</p>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{patient?.comments}</p>
              </div>
            )}
            {patient?.jg_comments && (
              <div>
                <p className="text-sm text-gray-500 mb-1">JG Comments</p>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{patient?.jg_comments}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
