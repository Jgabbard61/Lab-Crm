
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientForm } from '@/components/patient-form';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EditPatientPage({
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
  
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params?.id)
      .single();
    
    if (error) throw error;
    patient = data;
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
