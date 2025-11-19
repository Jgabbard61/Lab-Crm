
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientTable } from '@/components/patient-table';
import { getServerSession } from '@/lib/auth-server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  const supabase = createServerClient();
  let patients: any[] = [];
  
  try {
    // Fetch all patients
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (patientsError) throw patientsError;
    
    // Fetch tests for each patient
    const patientsWithTests = await Promise.all(
      (patientsData ?? []).map(async (patient) => {
        try {
          const { data: tests, error: testsError } = await supabase
            .from('tests')
            .select('*')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false });
          
          if (testsError) throw testsError;
          
          return { ...patient, tests: tests ?? [] };
        } catch (error) {
          console.error(`Error fetching tests for patient ${patient?.id}:`, error);
          return { ...patient, tests: [] };
        }
      })
    );
    
    patients = patientsWithTests;
  } catch (error) {
    console.error('Error fetching patients:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Patients" />
      
      <main className="container max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage patient profiles, tests, and claims</p>
        </div>
        
        <PatientTable patients={patients ?? []} />
      </main>
    </div>
  );
}
