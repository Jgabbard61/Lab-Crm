
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientTable } from '@/components/patient-table';
import { getAllPatients, getTestsByPatientId } from '@/lib/supabase/queries';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  let patients: any[] = [];
  try {
    patients = await getAllPatients();
    
    // Fetch tests for each patient
    const patientsWithTests = await Promise.all(
      patients?.map(async (patient) => {
        try {
          const tests = await getTestsByPatientId(patient?.id);
          return { ...patient, tests };
        } catch (error) {
          console.error(`Error fetching tests for patient ${patient?.id}:`, error);
          return { ...patient, tests: [] };
        }
      }) ?? []
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
