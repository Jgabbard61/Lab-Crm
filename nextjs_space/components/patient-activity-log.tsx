
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, FileEdit, FileText, Upload, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  action_type: string;
  entity_type: string;
  changes?: any;
  performed_at: string;
  performed_by?: any;
}

interface PatientActivityLogProps {
  activityLogs: ActivityLogEntry[];
}

export function PatientActivityLog({ activityLogs }: PatientActivityLogProps) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'Created':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'Updated':
        return <FileEdit className="h-4 w-4 text-blue-600" />;
      case 'Deleted':
        return <Trash className="h-4 w-4 text-red-600" />;
      case 'Document Uploaded':
        return <Upload className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'Created':
        return 'bg-green-100 text-green-800';
      case 'Updated':
        return 'bg-blue-100 text-blue-800';
      case 'Deleted':
        return 'bg-red-100 text-red-800';
      case 'Document Uploaded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderChangeSummary = (log: ActivityLogEntry) => {
    const { action_type, entity_type, changes } = log;

    if (action_type === 'Created') {
      if (entity_type === 'Patient') {
        return (
          <p className="text-sm text-gray-700 mt-2">
            Created new patient: <span className="font-medium">{changes?.created?.first_name} {changes?.created?.last_name}</span>
          </p>
        );
      } else if (entity_type === 'Test') {
        return (
          <p className="text-sm text-gray-700 mt-2">
            Added new test: <span className="font-medium">{changes?.created?.test_type}</span>
          </p>
        );
      }
    }

    if (action_type === 'Updated') {
      if (entity_type === 'Patient' && changes?.before && changes?.after) {
        const changedFields: string[] = [];
        const before = changes.before;
        const after = changes.after;
        
        // Check for important field changes
        if (before.status !== after.status) {
          changedFields.push(`Status: ${before.status || 'None'} → ${after.status}`);
        }
        if (before.insurance_payer !== after.insurance_payer) {
          changedFields.push(`Insurance: ${before.insurance_payer || 'None'} → ${after.insurance_payer}`);
        }
        if (before.medicare_id !== after.medicare_id) {
          changedFields.push(`Medicare ID: ${before.medicare_id || 'None'} → ${after.medicare_id}`);
        }
        if (before.referring_physician !== after.referring_physician) {
          changedFields.push(`Physician: ${before.referring_physician || 'None'} → ${after.referring_physician}`);
        }
        if (before.reference_laboratory !== after.reference_laboratory) {
          changedFields.push(`Reference Lab: ${before.reference_laboratory || 'None'} → ${after.reference_laboratory}`);
        }

        if (changedFields.length > 0) {
          return (
            <div className="text-sm text-gray-700 mt-2 space-y-1">
              <p className="font-medium">Changed fields:</p>
              <ul className="list-disc list-inside ml-2">
                {changedFields.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          );
        }
      } else if (entity_type === 'Test' && changes?.before && changes?.after) {
        const changedFields: string[] = [];
        const before = changes.before;
        const after = changes.after;
        
        if (before.claim_status !== after.claim_status) {
          changedFields.push(`Status: ${before.claim_status} → ${after.claim_status}`);
        }
        if (before.date_reported !== after.date_reported) {
          changedFields.push(`Date Reported: ${before.date_reported || 'None'} → ${after.date_reported || 'None'}`);
        }
        if (before.charges !== after.charges) {
          changedFields.push(`Charges: $${before.charges || 0} → $${after.charges || 0}`);
        }
        if (before.paid !== after.paid) {
          changedFields.push(`Paid: $${before.paid || 0} → $${after.paid || 0}`);
        }

        if (changedFields.length > 0) {
          return (
            <div className="text-sm text-gray-700 mt-2 space-y-1">
              <p className="font-medium">Test: {before.test_type}</p>
              <ul className="list-disc list-inside ml-2">
                {changedFields.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          );
        }
      }
    }

    if (action_type === 'Document Uploaded' && changes) {
      return (
        <p className="text-sm text-gray-700 mt-2">
          Uploaded <span className="font-medium">{changes.file_name}</span> to{' '}
          <Badge variant="secondary" className="ml-1">{changes.document_category}</Badge>
          {' '}({(changes.file_size / 1024).toFixed(1)} KB)
        </p>
      );
    }

    if (action_type === 'Deleted') {
      return (
        <p className="text-sm text-gray-700 mt-2">
          Deleted {entity_type.toLowerCase()}
        </p>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <p className="text-gray-600 mt-1">Track all changes and updates to patient profile</p>
      </div>

      {activityLogs?.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <Clock className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No activity recorded yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {activityLogs?.map((log) => (
            <Card key={log?.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getActionIcon(log?.action_type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getActionColor(log?.action_type)}>
                        {log?.action_type}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {log?.entity_type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      {log?.performed_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log?.performed_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                      {log?.performed_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log?.performed_by?.full_name || log?.performed_by?.username || 'System'}
                        </span>
                      )}
                    </div>

                    {/* Human-readable summary */}
                    {renderChangeSummary(log)}

                    {/* Raw details (collapsed by default) */}
                    {log?.changes && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-teal-600 cursor-pointer hover:text-teal-700">
                          View Raw Data
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">
                            {JSON.stringify(log?.changes, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
