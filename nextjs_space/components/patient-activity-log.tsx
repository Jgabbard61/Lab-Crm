
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

                    {log?.changes && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-teal-600 cursor-pointer hover:text-teal-700">
                          View Details
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto">
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
