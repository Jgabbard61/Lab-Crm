// CRM Constants and Configuration

// Test Status Flow - Complete Workflow
export const TEST_STATUS_OPTIONS = [
  { value: 'Kit Shipped', label: 'Kit Shipped', color: 'bg-blue-100 text-blue-800' },
  { value: 'Accession Accepted', label: 'Accession Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'Accession Rejected', label: 'Accession Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'Sent to Lab', label: 'Sent to Lab', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'Resulted', label: 'Resulted', color: 'bg-teal-100 text-teal-800' },
  { value: 'Billed', label: 'Billed', color: 'bg-amber-100 text-amber-800' },
  { value: 'Paid in Full', label: 'Paid in Full', color: 'bg-green-100 text-green-800' },
  { value: 'Partial Payment', label: 'Partial Payment', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Denied', label: 'Denied', color: 'bg-red-100 text-red-800' },
] as const;

// All possible status values (includes legacy for backward compatibility with existing data)
export const ALL_STATUS_VALUES = [
  ...TEST_STATUS_OPTIONS.map(opt => opt.value),
  'Pending',
  'Accessioning',
  'Accepted',
  'Rejected',
  'Kit Returned',
  'At Lab',
  'Ready for Bill',
  'Billed - Pending',
  'Billed - Confirmed',
  'Finalized',
] as const;

// Kit Shipment Status Options
export const KIT_SHIPMENT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Returned', label: 'Returned' },
] as const;

// Accessioning Status Options
export const ACCESSIONING_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'Accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const;

// Billing Status Options - Detailed billing workflow tracking
export const BILLING_STATUS_OPTIONS = [
  { value: 'Not Billed', label: 'Not Billed', color: 'bg-gray-100 text-gray-800' },
  { value: 'Ready to Bill', label: 'Ready to Bill', color: 'bg-blue-100 text-blue-800' },
  { value: 'Sent to Payer', label: 'Sent to Payer', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'Received by Payer', label: 'Received by Payer', color: 'bg-purple-100 text-purple-800' },
  { value: 'Under Review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Claim Accepted', label: 'Claim Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'Claim Rejected', label: 'Claim Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'Claim Denied', label: 'Claim Denied', color: 'bg-red-200 text-red-900' },
  { value: 'Needs Resubmit', label: 'Needs Resubmit', color: 'bg-orange-100 text-orange-800' },
  { value: 'Resubmitted', label: 'Resubmitted', color: 'bg-amber-100 text-amber-800' },
  { value: 'Partial Payment', label: 'Partial Payment', color: 'bg-teal-100 text-teal-800' },
  { value: 'Paid in Full', label: 'Paid in Full', color: 'bg-green-200 text-green-900' },
] as const;

// Document Categories
export const DOCUMENT_CATEGORIES = [
  { value: 'Lab Results', label: 'Lab Results', icon: '🧪', color: 'bg-teal-100 text-teal-800' },
  { value: 'EOB/EOP', label: 'EOB/EOP', icon: '💰', color: 'bg-blue-100 text-blue-800' },
  { value: 'Claim Checks', label: 'Claim Checks', icon: '💳', color: 'bg-green-100 text-green-800' },
  { value: 'Insurance Correspondence', label: 'Insurance Correspondence', icon: '✉️', color: 'bg-purple-100 text-purple-800' },
  { value: 'Requisition Forms', label: 'Requisition Forms', icon: '📋', color: 'bg-orange-100 text-orange-800' },
] as const;

// Patient Status Options
export const PATIENT_STATUS_OPTIONS = [
  { value: 'Claim Pending', label: 'Claim Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Billed', label: 'Billed', color: 'bg-blue-100 text-blue-800' },
  { value: 'Claim Received', label: 'Claim Received', color: 'bg-purple-100 text-purple-800' },
  { value: 'Paid in Full', label: 'Paid in Full', color: 'bg-green-100 text-green-800' },
  { value: 'Partial Payment', label: 'Partial Payment', color: 'bg-orange-100 text-orange-800' },
  { value: 'Denied', label: 'Denied', color: 'bg-red-100 text-red-800' },
] as const;

// Test Types - PCR and Genetics
export const TEST_TYPES = [
  // PCR Tests
  { value: 'UTI', label: 'UTI (PCR)', category: 'PCR' },
  { value: 'GI', label: 'GI (PCR)', category: 'PCR' },

  // Genetics Tests
  { value: 'Eye Disorder', label: 'Eye Disorder (Genetics)', category: 'Genetics' },
  { value: 'Immune', label: 'Immune (Genetics)', category: 'Genetics' },
  { value: 'Neuro', label: 'Neuro (Genetics)', category: 'Genetics' },
  { value: 'Cardio Pulmonary', label: 'Cardio Pulmonary (Genetics)', category: 'Genetics' },
  { value: 'CGX', label: 'CGX (Genetics)', category: 'Genetics' },
  { value: 'PGX', label: 'PGX (Genetics)', category: 'Genetics' },
  { value: 'Thyroid', label: 'Thyroid (Genetics)', category: 'Genetics' },
] as const;

// Note Priority Options
export const NOTE_PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low Priority', color: 'bg-gray-100 text-gray-800' },
  { value: 'High', label: '!! HIGH PRIORITY !!', color: 'bg-red-100 text-red-800 font-bold' },
] as const;

// Helper function to get status color
export function getStatusColor(status: string): string {
  const statusOption = TEST_STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
}

// Helper function to get accessioning status color
export function getAccessioningStatusColor(status: string): string {
  const statusOption = ACCESSIONING_STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
}

// Helper function to get billing status color
export function getBillingStatusColor(status: string): string {
  const statusOption = BILLING_STATUS_OPTIONS.find(opt => opt.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
}

// Helper function to format tracking URL
export function getFedExTrackingUrl(trackingNumber: string): string {
  return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
}
