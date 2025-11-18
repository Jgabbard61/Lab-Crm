
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { findPatientByNameAndDOB } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

const HEADER_MAPPING: Record<string, string> = {
  'accession': 'accession_id',
  'claim status': 'claim_status',
  'test/modality': 'test_type',
  'dos(collection)': 'date_of_service',
  'first name': 'first_name',
  'last name': 'last_name',
  'gender': 'gender',
  'date of birth': 'date_of_birth',
  'address': 'address',
  'icd-10 code': 'icd10_codes',
  'result-in date': 'result_in_date',
  'result fax date': 'result_fax_date',
  'ref physician': 'referring_physician',
  'npi#': 'npi_number',
  'clinic/facility/ref lab': 'clinic_facility',
  'sales rep': 'sales_rep',
  'insurance': 'insurance_payer',
  'policy': 'policy_number',
  'comments': 'comments',
  'billed date': 'billed_date',
  'claim': 'claim_number',
  'charges': 'charges',
  'paid': 'paid',
  'ded/coins': 'ded_coins',
  'patient responsibility': 'patient_responsibility',
  'check/eft#': 'check_eft_number',
  'check/eft date': 'check_eft_date',
  'jg comments': 'jg_comments',
  'mr': 'mr',
  'payment #': 'payment_number',
  'payment date': 'payment_date',
  'correction/requests': 'correction_requests',
  'deductible': 'deductible',
  'fax': 'fax',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames?.[0];
    const worksheet = workbook.Sheets?.[sheetName ?? ''];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rawData?.length === 0) {
      return NextResponse.json(
        { message: 'Excel file is empty' },
        { status: 400 }
      );
    }

    // Process each row
    const preview = await Promise.all(
      rawData?.map(async (row, index) => {
        try {
          // Map headers
          const mappedRow: any = {};
          Object.keys(row ?? {})?.forEach((key) => {
            const normalizedKey = key?.toLowerCase()?.trim();
            const mappedKey = HEADER_MAPPING[normalizedKey];
            if (mappedKey) {
              mappedRow[mappedKey] = row?.[key];
            }
          });

          // Parse dates
          if (mappedRow?.date_of_birth) {
            mappedRow.date_of_birth = parseExcelDate(mappedRow?.date_of_birth);
          }
          if (mappedRow?.date_of_service) {
            mappedRow.date_of_service = parseExcelDate(mappedRow?.date_of_service);
          }

          // Check if patient exists (match by last name + DOB)
          let matchStatus: 'new' | 'existing' | 'update' = 'new';
          let patientName = `${mappedRow?.first_name || ''} ${mappedRow?.last_name || ''}`.trim();

          if (mappedRow?.last_name && mappedRow?.date_of_birth) {
            const existingPatient = await findPatientByNameAndDOB(
              mappedRow?.last_name,
              mappedRow?.date_of_birth
            );

            if (existingPatient) {
              // Patient exists - will update missing fields
              matchStatus = 'update';
              patientName = `${existingPatient?.first_name} ${existingPatient?.last_name}`;
            }
          }

          return {
            row_number: index + 2, // Excel row number (1-indexed + header)
            data: mappedRow,
            match_status: matchStatus,
            patient_name: patientName,
            errors: [],
          };
        } catch (error: any) {
          return {
            row_number: index + 2,
            data: row,
            match_status: 'new' as const,
            patient_name: 'Error',
            errors: [error?.message || 'Failed to process row'],
          };
        }
      }) ?? []
    );

    return NextResponse.json({ preview });
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to preview file' },
      { status: 500 }
    );
  }
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;

  // If it's already a date string
  if (typeof value === 'string') {
    // Try parsing common date formats
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')?.[0] ?? null;
    }
    return value;
  }

  // If it's an Excel serial number
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }

  return null;
}
