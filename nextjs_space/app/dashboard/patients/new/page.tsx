
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { PatientForm } from '@/components/patient-form';

export const dynamic = 'force-dynamic';

export default async function NewPatientPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Patients" />
      
      <main className="container max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Patient</h1>
          <p className="text-gray-600 mt-1">Create a new patient profile</p>
        </div>
        
        <PatientForm />
      </main>
    </div>
  );
}
