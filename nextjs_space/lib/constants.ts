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

  // Legacy statuses (for backward compatibility with old data)
  { value: 'Pending', label: 'Pending (Legacy)', color: 'bg-gray-100 text-gray-800' },
  { value: 'Accessioning', label: 'Accessioning (Legacy)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Accepted', label: 'Accepted (Legacy)', color: 'bg-green-100 text-green-800' },
  { value: 'Rejected', label: 'Rejected (Legacy)', color: 'bg-red-100 text-red-800' },
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

// Document Categories
export const DOCUMENT_CATEGORIES = [
  { value: 'all', label: 'All Documents', icon: '📁' },
  { value: 'Results', label: 'Results', icon: '🧪' },
  { value: 'EOBs', label: 'EOBs', icon: '💰' },
  { value: 'Denials', label: 'Denials', icon: '⚠️' },
  { value: 'Payments', label: 'Payments', icon: '💳' },
  { value: 'Insurance Correspondence', label: 'Insurance Correspondence', icon: '✉️' },
  { value: 'Requisitions', label: 'Requisitions', icon: '📋' },
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

// Helper function to format tracking URL
export function getFedExTrackingUrl(trackingNumber: string): string {
  return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
}
