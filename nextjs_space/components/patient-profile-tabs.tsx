
'use client';

import { useState } from 'react';
import { Patient, Test, Document, ActivityLog } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientOverview } from '@/components/patient-overview';
import { PatientTests } from '@/components/patient-tests';
import { PatientDocuments } from '@/components/patient-documents';
import { PatientActivityLog } from '@/components/patient-activity-log';
import { FileText, Stethoscope, FolderOpen, History } from 'lucide-react';

interface PatientProfileTabsProps {
  patient: Patient;
  tests: Test[];
  documents: Document[];
  activityLogs: any[];
}

export function PatientProfileTabs({
  patient,
  tests: initialTests,
  documents: initialDocuments,
  activityLogs,
}: PatientProfileTabsProps) {
  const [tests, setTests] = useState(initialTests);
  const [documents, setDocuments] = useState(initialDocuments);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h1 className="text-3xl font-bold text-gray-900">
          {patient?.last_name}, {patient?.first_name}
        </h1>
        <p className="text-gray-600 mt-1">Patient Profile</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">Tests & Claims</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Activity Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PatientOverview patient={patient} />
        </TabsContent>

        <TabsContent value="tests">
          <PatientTests
            patientId={patient?.id}
            tests={tests}
            onTestsUpdate={setTests}
          />
        </TabsContent>

        <TabsContent value="documents">
          <PatientDocuments
            patientId={patient?.id}
            documents={documents}
            onDocumentsUpdate={setDocuments}
          />
        </TabsContent>

        <TabsContent value="activity">
          <PatientActivityLog activityLogs={activityLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
