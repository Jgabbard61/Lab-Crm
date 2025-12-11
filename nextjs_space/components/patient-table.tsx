'use client';

import { useState, useMemo } from 'react';
import { Patient, Test } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Eye, Calendar, Package, CheckCircle, XCircle, Beaker, DollarSign, Filter } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getStatusColor, getAccessioningStatusColor } from '@/lib/constants';

interface PatientWithTests extends Patient {
  tests?: Test[];
}

interface PatientTableProps {
  patients: PatientWithTests[];
}

// Quick status summary for a test
function getTestWorkflowSummary(test: Test) {
  return {
    kitStatus: test.kit_shipment_status || 'Not Started',
    accessioningStatus: test.accessioning_status || 'Pending',
    labStatus: test.sent_to_lab_date ? 'Sent to Lab' : 'Not Sent',
    claimStatus: test.claim_status || 'Pending',
  };
}

// Get the most critical status to display
function getCriticalStatus(tests: Test[]) {
  if (!tests || tests.length === 0) return null;

  // Priority order based on workflow: Accession Rejected > Accession Accepted > Sent to Lab > Resulted > Billed > Kit Shipped

  // Check for rejected samples (highest priority - needs attention)
  const rejected = tests.find(t => t.accessioning_status === 'Rejected' || t.claim_status === 'Accession Rejected');
  if (rejected) return { status: 'Accession Rejected', type: 'accessioning', test: rejected };

  // Check for accepted samples
  const accepted = tests.find(t => t.accessioning_status === 'Accepted' || t.claim_status === 'Accession Accepted');
  if (accepted) return { status: 'Accession Accepted', type: 'accessioning', test: accepted };

  // Check for samples sent to lab
  const sentToLab = tests.find(t => t.sent_to_lab_date && !t.results_received_date);
  if (sentToLab) return { status: 'Sent to Lab', type: 'lab', test: sentToLab };

  // Check for resulted samples
  const resulted = tests.find(t => t.results_received_date);
  if (resulted) return { status: 'Resulted', type: 'lab', test: resulted };

  // Check for billed samples
  const billed = tests.find(t => t.claim_status?.includes('Billed') || t.claim_status === 'Billed');
  if (billed) return { status: 'Billed', type: 'billing', test: billed };

  // Check for kit shipped (initial status)
  const kitShipped = tests.find(t => t.kit_shipment_status === 'Shipped' || t.claim_status === 'Kit Shipped');
  if (kitShipped) return { status: 'Kit Shipped', type: 'shipping', test: kitShipped };

  return null;
}

// Count tests by workflow stage
function getWorkflowCounts(tests: Test[]) {
  return {
    accepted: tests.filter(t => t.accessioning_status === 'Accepted' || t.claim_status === 'Accession Accepted').length,
    rejected: tests.filter(t => t.accessioning_status === 'Rejected' || t.claim_status === 'Accession Rejected').length,
    sentToLab: tests.filter(t => t.sent_to_lab_date && !t.results_received_date).length,
    resulted: tests.filter(t => t.results_received_date).length,
    billed: tests.filter(t => t.claim_status?.includes('Billed') || t.claim_status === 'Billed').length,
    paid: tests.filter(t => t.claim_status === 'Paid in Full').length,
  };
}

export function PatientTable({ patients }: PatientTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');

  // Calculate total workflow counts across all patients
  const totalCounts = useMemo(() => {
    const allTests = patients.flatMap(p => p.tests || []);
    return getWorkflowCounts(allTests);
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients?.filter((patient) => {
      // Search filter
      const matchesSearch = 
        patient?.last_name?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '') ||
        patient?.first_name?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '') ||
        patient?.medicare_id?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '');
      
      if (!matchesSearch) return false;

      // Status filter (patient-level)
      if (statusFilter !== 'all' && patient?.status !== statusFilter) {
        return false;
      }

      // Workflow filter (test-level)
      if (workflowFilter !== 'all') {
        const tests = patient?.tests || [];
        switch (workflowFilter) {
          case 'accepted':
            return tests.some(t => t.accessioning_status === 'Accepted' || t.claim_status === 'Accession Accepted');
          case 'rejected':
            return tests.some(t => t.accessioning_status === 'Rejected' || t.claim_status === 'Accession Rejected');
          case 'sent_to_lab':
            return tests.some(t => t.sent_to_lab_date && !t.results_received_date);
          case 'resulted':
            return tests.some(t => t.results_received_date);
          case 'billed':
            return tests.some(t => t.claim_status?.includes('Billed') || t.claim_status === 'Billed');
          case 'paid':
            return tests.some(t => t.claim_status === 'Paid in Full');
          default:
            return true;
        }
      }

      return true;
    }) ?? [];
  }, [patients, searchQuery, statusFilter, workflowFilter]);

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar - Workflow Tracking */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{totalCounts.accepted}</p>
            <p className="text-xs text-gray-600">Accession Accepted</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-red-600">{totalCounts.rejected}</p>
            <p className="text-xs text-gray-600">Accession Rejected</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-purple-600">{totalCounts.sentToLab}</p>
            <p className="text-xs text-gray-600">Sent to Lab</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-cyan-600">{totalCounts.resulted}</p>
            <p className="text-xs text-gray-600">Resulted</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-orange-600">{totalCounts.billed}</p>
            <p className="text-xs text-gray-600">Billed</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-700">{totalCounts.paid}</p>
            <p className="text-xs text-gray-600">Paid</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by last name, first name, or Medicare ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Link href="/dashboard/patients/new">
            <Button className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2 h-11">
              <Plus className="h-4 w-4" />
              New Patient
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Patient Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patient Statuses</SelectItem>
                <SelectItem value="Claim Pending">Claim Pending</SelectItem>
                <SelectItem value="Billed">Billed</SelectItem>
                <SelectItem value="Claim Received">Claim Received</SelectItem>
                <SelectItem value="Paid in Full">Paid in Full</SelectItem>
                <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                <SelectItem value="Denied">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Workflow Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflow Stages</SelectItem>
                <SelectItem value="accepted">✅ Accession Accepted ({totalCounts.accepted})</SelectItem>
                <SelectItem value="rejected">❌ Accession Rejected ({totalCounts.rejected})</SelectItem>
                <SelectItem value="sent_to_lab">🔬 Sent to Lab ({totalCounts.sentToLab})</SelectItem>
                <SelectItem value="resulted">📊 Resulted ({totalCounts.resulted})</SelectItem>
                <SelectItem value="billed">💰 Billed ({totalCounts.billed})</SelectItem>
                <SelectItem value="paid">💵 Paid ({totalCounts.paid})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== 'all' || workflowFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('all');
                setWorkflowFilter('all');
              }}
              className="h-10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-4">
        {filteredPatients?.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No patients found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          </Card>
        ) : (
          filteredPatients?.map((patient) => {
            const criticalStatus = getCriticalStatus(patient?.tests || []);
            const testCounts = getWorkflowCounts(patient?.tests || []);

            return (
              <Card
                key={patient?.id}
                className="hover:shadow-lg transition-all duration-200 border-l-4"
                style={{
                  borderLeftColor: 
                    criticalStatus?.type === 'accessioning' && criticalStatus?.status === 'Rejected' ? '#dc2626' :
                    criticalStatus?.type === 'accessioning' ? '#f59e0b' :
                    criticalStatus?.type === 'shipping' ? '#3b82f6' :
                    criticalStatus?.type === 'lab' ? '#8b5cf6' :
                    '#10b981'
                }}
              >
                <Link href={`/dashboard/patients/${patient?.id}`}>
                  <div className="p-6">
                    {/* Patient Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient?.last_name}, {patient?.first_name}
                          </h3>
                          {patient?.status && (
                            <Badge
                              variant={
                                patient?.status === 'Paid in Full'
                                  ? 'default'
                                  : patient?.status === 'Denied'
                                  ? 'destructive'
                                  : patient?.status === 'Claim Received' || patient?.status === 'Billed'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {patient?.status}
                            </Badge>
                          )}
                          {criticalStatus && (
                            <Badge
                              className={`text-xs ${
                                criticalStatus.type === 'accessioning' && criticalStatus.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : criticalStatus.type === 'accessioning'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : criticalStatus.type === 'shipping'
                                  ? 'bg-blue-100 text-blue-800'
                                  : criticalStatus.type === 'lab'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              🔔 {criticalStatus.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {patient?.gender && <span>{patient?.gender}</span>}
                          {patient?.date_of_birth && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(patient?.date_of_birth), 'MM/dd/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/patients/${patient?.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>

                    {/* Patient Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm mb-4">
                      {patient?.medicare_id && (
                        <div>
                          <span className="text-gray-500">Medicare ID:</span>{' '}
                          <span className="font-medium">{patient?.medicare_id}</span>
                        </div>
                      )}
                      {patient?.insurance_payer && (
                        <div>
                          <span className="text-gray-500">Insurance:</span>{' '}
                          <span className="font-medium">{patient?.insurance_payer}</span>
                        </div>
                      )}
                      {patient?.referring_physician && (
                        <div>
                          <span className="text-gray-500">Physician:</span>{' '}
                          <span className="font-medium">{patient?.referring_physician}</span>
                        </div>
                      )}
                      {(patient?.reference_laboratory || patient?.clinic_facility) && (
                        <div>
                          <span className="text-gray-500">Reference Lab:</span>{' '}
                          <span className="font-medium">{patient?.reference_laboratory || patient?.clinic_facility}</span>
                        </div>
                      )}
                    </div>

                    {/* Workflow Status Summary */}
                    {patient?.tests && patient?.tests?.length > 0 && (
                      <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Filter className="h-4 w-4" />
                          Workflow Status ({patient?.tests?.length} test{patient?.tests?.length > 1 ? 's' : ''})
                        </div>
                        
                        {/* Quick workflow badges */}
                        <div className="flex flex-wrap gap-2">
                          {testCounts.accepted > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                              ✅ {testCounts.accepted} Accepted
                            </Badge>
                          )}
                          {testCounts.rejected > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
                              ❌ {testCounts.rejected} Rejected
                            </Badge>
                          )}
                          {testCounts.sentToLab > 0 && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300">
                              🔬 {testCounts.sentToLab} Sent to Lab
                            </Badge>
                          )}
                          {testCounts.resulted > 0 && (
                            <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-300">
                              📊 {testCounts.resulted} Resulted
                            </Badge>
                          )}
                          {testCounts.billed > 0 && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300">
                              💰 {testCounts.billed} Billed
                            </Badge>
                          )}
                          {testCounts.paid > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
                              💵 {testCounts.paid} Paid
                            </Badge>
                          )}
                        </div>

                        {/* Individual test statuses */}
                        <div className="space-y-2">
                          {patient?.tests?.map((test) => {
                            const workflow = getTestWorkflowSummary(test);
                            return (
                              <div
                                key={test?.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                              >
                                <span className="font-medium text-gray-700">{test?.test_type}</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {test.kit_shipment_status && test.kit_shipment_status !== 'Pending' && (
                                    <Badge variant="outline" className="text-xs bg-blue-50">
                                      📦 {test.kit_shipment_status}
                                    </Badge>
                                  )}
                                  {test.accessioning_status && (
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        test.accessioning_status === 'Accepted' ? 'bg-green-50 text-green-700' :
                                        test.accessioning_status === 'Rejected' ? 'bg-red-50 text-red-700' :
                                        'bg-yellow-50 text-yellow-700'
                                      }`}
                                    >
                                      {test.accessioning_status === 'Accepted' ? '✅' :
                                       test.accessioning_status === 'Rejected' ? '❌' : '🔍'} {test.accessioning_status}
                                    </Badge>
                                  )}
                                  {test.sent_to_lab_date && (
                                    <Badge variant="outline" className="text-xs bg-purple-50">
                                      🔬 {test.results_received_date ? 'Resulted' : 'At Lab'}
                                    </Badge>
                                  )}
                                  <Badge className={getStatusColor(test?.claim_status)} style={{ fontSize: '0.7rem' }}>
                                    {test?.claim_status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </Card>
            );
          })
        )}
      </div>

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredPatients?.length} of {patients?.length} patients
      </div>
    </div>
  );
}
