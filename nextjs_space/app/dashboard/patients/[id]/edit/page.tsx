
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientForm } from '@/components/patient-form';
import { getPatientById } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function EditPatientPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  let patient = null;
  try {
    patient = await getPatientById(params?.id);
  } catch (error) {
    console.error('Error fetching patient:', error);
  }

  if (!patient) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Patients" />
      
      <main className="container max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Patient</h1>
          <p className="text-gray-600 mt-1">
            Update patient profile for {patient?.first_name} {patient?.last_name}
          </p>
        </div>
        
        <PatientForm patient={patient} isEdit />
      </main>
    </div>
  );
}
