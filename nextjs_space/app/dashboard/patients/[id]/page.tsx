
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientProfileTabs } from '@/components/patient-profile-tabs';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PatientProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  const supabase = createServerClient();
  let patient = null;
  let tests: any[] = [];
  let documents: any[] = [];
  let activityLogs: any[] = [];

  try {
    // Fetch patient
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params?.id)
      .single();
    
    if (patientError) throw patientError;
    patient = patientData;
    
    // Fetch tests
    const { data: testsData, error: testsError } = await supabase
      .from('tests')
      .select('*')
      .eq('patient_id', params?.id)
      .order('created_at', { ascending: false });
    
    if (testsError) throw testsError;
    tests = testsData ?? [];
    
    // Fetch documents
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', params?.id)
      .order('uploaded_at', { ascending: false });
    
    if (documentsError) throw documentsError;
    documents = documentsData ?? [];
    
    // Fetch activity logs
    const { data: logsData, error: logsError } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('patient_id', params?.id)
      .order('performed_at', { ascending: false });
    
    if (logsError) throw logsError;
    activityLogs = logsData ?? [];
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
