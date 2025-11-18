
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardHeader } from '@/components/dashboard-header';
import { ReportsAnalytics } from '@/components/reports-analytics';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch analytics data
  let testsData: any[] = [];
  let payersData: Record<string, any> = {};
  
  try {
    // Get all tests with patient insurance info
    const { data: tests, error } = await supabase
      .from('tests')
      .select(`
        *,
        patient:patients (
          insurance_payer,
          first_name,
          last_name
        )
      `);

    if (!error && tests) {
      testsData = tests;

      // Group by payer
      payersData = tests?.reduce((acc: any, test: any) => {
        const payer = test?.patient?.insurance_payer || 'Unknown';
        
        if (!acc[payer]) {
          acc[payer] = {
            total_claims: 0,
            finalized: 0,
            denied: 0,
            pending: 0,
            total_charges: 0,
            total_paid: 0,
          };
        }

        acc[payer].total_claims++;
        acc[payer].total_charges += Number(test?.charges ?? 0);
        acc[payer].total_paid += Number(test?.paid ?? 0);

        if (test?.claim_status === 'Finalized') acc[payer].finalized++;
        if (test?.claim_status === 'Denied') acc[payer].denied++;
        if (test?.claim_status === 'Pending') acc[payer].pending++;

        return acc;
      }, {});
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="Reports" />
      
      <main className="container max-w-screen-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive performance analysis and insights</p>
        </div>
        
        <ReportsAnalytics testsData={testsData} payersData={payersData} />
      </main>
    </div>
  );
}
