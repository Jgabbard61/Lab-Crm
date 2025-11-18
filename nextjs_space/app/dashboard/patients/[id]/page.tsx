
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientProfileTabs } from '@/components/patient-profile-tabs';
import { 
  getPatientById, 
  getTestsByPatientId, 
  getDocumentsByPatientId,
  getActivityLogsByPatientId 
} from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function PatientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  let patient = null;
  let tests: any[] = [];
  let documents: any[] = [];
  let activityLogs: any[] = [];

  try {
    patient = await getPatientById(params?.id);
    tests = await getTestsByPatientId(params?.id);
    documents = await getDocumentsByPatientId(params?.id);
    activityLogs = await getActivityLogsByPatientId(params?.id);
  } catch (error) {
    console.error('Error fetching patient data:', error);
  }

  if (!patient) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Patients" />
      
      <main className="container max-w-screen-2xl mx-auto px-6 py-8">
        <PatientProfileTabs
          patient={patient}
          tests={tests ?? []}
          documents={documents ?? []}
          activityLogs={activityLogs ?? []}
        />
      </main>
    </div>
  );
}
