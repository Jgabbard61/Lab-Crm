
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { DashboardHeader } from '@/components/dashboard-header';
import { ExcelImportComponent } from '@/components/excel-import';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Import" />
      
      <main className="container max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Excel Import</h1>
          <p className="text-gray-600 mt-1">Batch import patient data from Excel files</p>
        </div>
        
        <ExcelImportComponent />
      </main>
    </div>
  );
}
