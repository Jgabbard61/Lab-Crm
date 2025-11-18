
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ReportsAnalyticsProps {
  testsData: any[];
  payersData: Record<string, any>;
}

const COLORS = ['#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'];

export function ReportsAnalytics({ testsData, payersData }: ReportsAnalyticsProps) {
  const { toast } = useToast();
  const [testTypeFilter, setTestTypeFilter] = useState<string>('all');
  const [payerFilter, setPayerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter data
  const filteredTests = useMemo(() => {
    return testsData?.filter((test) => {
      let match = true;

      if (testTypeFilter !== 'all' && test?.test_type !== testTypeFilter) {
        match = false;
      }

      if (payerFilter !== 'all' && test?.patient?.insurance_payer !== payerFilter) {
        match = false;
      }

      if (startDate && test?.date_of_service && test?.date_of_service < startDate) {
        match = false;
      }

      if (endDate && test?.date_of_service && test?.date_of_service > endDate) {
        match = false;
      }

      return match;
    }) ?? [];
  }, [testsData, testTypeFilter, payerFilter, startDate, endDate]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalTests = filteredTests?.length ?? 0;
    const finalized = filteredTests?.filter((t) => t?.claim_status === 'Finalized')?.length ?? 0;
    const denied = filteredTests?.filter((t) => t?.claim_status === 'Denied')?.length ?? 0;
    const pending = filteredTests?.filter((t) => t?.claim_status === 'Pending')?.length ?? 0;
    
    const totalCharges = filteredTests?.reduce((sum, t) => sum + Number(t?.charges ?? 0), 0) ?? 0;
    const totalPaid = filteredTests?.reduce((sum, t) => sum + Number(t?.paid ?? 0), 0) ?? 0;

    const approvalRate = totalTests > 0 ? ((finalized / totalTests) * 100)?.toFixed(1) : '0';
    const denialRate = totalTests > 0 ? ((denied / totalTests) * 100)?.toFixed(1) : '0';

    return {
      totalTests,
      finalized,
      denied,
      pending,
      totalCharges,
      totalPaid,
      approvalRate,
      denialRate,
    };
  }, [filteredTests]);

  // Revenue by test type
  const revenueByTestType = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    filteredTests?.forEach((test) => {
      const type = test?.test_type || 'Unknown';
      grouped[type] = (grouped[type] || 0) + Number(test?.paid ?? 0);
    });

    return Object.entries(grouped ?? {})?.map(([name, value]) => ({
      name,
      value: Number(value?.toFixed(2)),
    }));
  }, [filteredTests]);

  // Claims by status
  const claimsByStatus = useMemo(() => {
    return [
      { name: 'Finalized', value: metrics?.finalized ?? 0 },
      { name: 'Denied', value: metrics?.denied ?? 0 },
      { name: 'Pending', value: metrics?.pending ?? 0 },
    ];
  }, [metrics]);

  // Top payers
  const topPayers = useMemo(() => {
    const payerStats: Record<string, { total: number; denied: number }> = {};
    
    filteredTests?.forEach((test) => {
      const payer = test?.patient?.insurance_payer || 'Unknown';
      if (!payerStats[payer]) {
        payerStats[payer] = { total: 0, denied: 0 };
      }
      payerStats[payer].total++;
      if (test?.claim_status === 'Denied') {
        payerStats[payer].denied++;
      }
    });

    return Object.entries(payerStats ?? {})
      ?.map(([name, stats]) => ({
        name,
        total: stats?.total ?? 0,
        denied: stats?.denied ?? 0,
        approval_rate: stats?.total > 0 ? (((stats?.total - stats?.denied) / stats?.total) * 100)?.toFixed(1) : '0',
      }))
      ?.sort((a, b) => (b?.total ?? 0) - (a?.total ?? 0))
      ?.slice(0, 10);
  }, [filteredTests]);

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredTests?.map((test) => ({
        'Patient Name': `${test?.patient?.first_name || ''} ${test?.patient?.last_name || ''}`,
        'Test Type': test?.test_type,
        'Accession ID': test?.accession_id,
        'Date of Service': test?.date_of_service,
        'Claim Status': test?.claim_status,
        'Insurance Payer': test?.patient?.insurance_payer,
        'Charges': test?.charges,
        'Paid': test?.paid,
        'Patient Responsibility': test?.patient_responsibility,
        'Claim Number': test?.claim_number,
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData ?? []);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');

      // Generate file name with timestamp
      const timestamp = new Date().toISOString().split('T')?.[0];
      const fileName = `patient_crm_report_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, fileName);

      toast({
        title: 'Export successful',
        description: `Report exported to ${fileName}`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.message || 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  const testTypes = Array.from(new Set(testsData?.map((t) => t?.test_type) ?? []))?.filter(Boolean);
  const payers = Array.from(new Set(testsData?.map((t) => t?.patient?.insurance_payer) ?? []))?.filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filters</CardTitle>
            <Button
              onClick={handleExportToExcel}
              className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {testTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Insurance Payer</Label>
              <Select value={payerFilter} onValueChange={setPayerFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payers</SelectItem>
                  {payers?.map((payer) => (
                    <SelectItem key={payer} value={payer}>
                      {payer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Tests</p>
                <p className="text-3xl font-bold text-gray-900">{metrics?.totalTests ?? 0}</p>
              </div>
              <FileText className="h-12 w-12 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${metrics?.totalPaid?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approval Rate</p>
                <p className="text-3xl font-bold text-blue-600">{metrics?.approvalRate}%</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Denial Rate</p>
                <p className="text-3xl font-bold text-red-600">{metrics?.denialRate}%</p>
              </div>
              <TrendingDown className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Test Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTestType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0D9488" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={claimsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry?.name}: ${entry?.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {claimsByStatus?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS?.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Payers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Insurance Payers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Payer</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total Claims</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Denied</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Approval Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topPayers?.map((payer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{payer?.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{payer?.total}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">{payer?.denied}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span
                        className={`font-semibold ${
                          Number(payer?.approval_rate ?? 0) >= 90
                            ? 'text-green-600'
                            : Number(payer?.approval_rate ?? 0) >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {payer?.approval_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
