
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { 
  findPatientByNameAndDOB,
  createPatient,
  updatePatient,
  createTest,
} from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

const HEADER_MAPPING: Record<string, string> = {
  // Accession ID (multiple variations)
  'accession': 'accession_id',
  
  // Patient Name Fields
  'first name': 'first_name',
  'first': 'first_name',
  'last name': 'last_name',
  'last': 'last_name',
  
  // Date of Birth (multiple variations)
  'date of birth': 'date_of_birth',
  'dob': 'date_of_birth',
  
  // Gender
  'gender': 'gender',
  
  // Contact Info
  'address': 'address',
  'phone': 'phone',
  'city': 'city',
  'state': 'state',
  'zip': 'zip',
  'fax': 'fax',
  
  // Test Information
  'test/modality': 'test_type',
  'test name': 'test_type',
  'claim status': 'claim_status',
  'test result status': 'claim_status',
  
  // Dates - Date of Service
  'dos(collection)': 'date_of_service',
  'dos': 'date_of_service',
  
  // Kit Tracking (NEW - from your tracking sheet)
  'kit shipment tracking id': 'kit_shipment_tracking',
  'kit shipment tracking': 'kit_shipment_tracking',
  'pt kit return tracking id': 'kit_return_tracking',
  'kit return tracking': 'kit_return_tracking',
  'kit received date': 'kit_received_date',
  'kit return status': 'accessioning_status',
  'entered date': 'kit_shipped_date',
  
  // Accessioning/QC
  'comments / rejection reason': 'accessioning_notes',
  'rejection reason': 'accessioning_notes',
  
  // ICD Codes
  'icd-10 code': 'icd10_codes',
  'icd codes': 'icd10_codes',
  'icd10': 'icd10_codes',
  
  // Result Dates
  'result-in date': 'result_in_date',
  'result fax date': 'result_fax_date',
  
  // Physician Information
  'ref physician': 'referring_physician',
  'ref provider': 'referring_physician',
  'npi#': 'npi_number',
  'npi': 'npi_number',
  
  // Facility/Lab
  'clinic/facility/ref lab': 'clinic_facility',
  'reference lab': 'reference_laboratory',
  
  // Sales Rep
  'sales rep': 'sales_rep',
  
  // Insurance
  'insurance': 'insurance_payer',
  'insurance name': 'insurance_payer',
  'primary insurance name': 'insurance_payer',
  'policy': 'policy_number',
  'member id': 'policy_number',
  
  // Medical History
  'personal history': 'personal_history',
  'family history': 'family_history',
  'ethnicity': 'ethnicity',
  
  // Comments & Notes
  'comments': 'comments',
  'notes': 'comments',
  'chartnotes': 'comments',
  'pa notes': 'comments',
  'fedex notes': 'comments',
  'jg comments': 'jg_comments',
  'mr': 'mr',
  
  // Billing Information
  'billed date': 'billed_date',
  'claim': 'claim_number',
  'charges': 'charges',
  'paid': 'paid',
  'ded/coins': 'ded_coins',
  'patient responsibility': 'patient_responsibility',
  'check/eft#': 'check_eft_number',
  'check/eft date': 'check_eft_date',
  'payment #': 'payment_number',
  'payment date': 'payment_date',
  'deductible': 'deductible',
  'correction/requests': 'correction_requests',
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

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames?.[0];
    const worksheet = workbook.Sheets?.[sheetName ?? ''];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    let successfulRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rawData?.length; i++) {
      const row = rawData?.[i];
      const rowNumber = i + 2;

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
        if (mappedRow?.result_in_date) {
          mappedRow.result_in_date = parseExcelDate(mappedRow?.result_in_date);
        }
        if (mappedRow?.result_fax_date) {
          mappedRow.result_fax_date = parseExcelDate(mappedRow?.result_fax_date);
        }
        if (mappedRow?.billed_date) {
          mappedRow.billed_date = parseExcelDate(mappedRow?.billed_date);
        }
        if (mappedRow?.check_eft_date) {
          mappedRow.check_eft_date = parseExcelDate(mappedRow?.check_eft_date);
        }
        if (mappedRow?.payment_date) {
          mappedRow.payment_date = parseExcelDate(mappedRow?.payment_date);
        }

        // Parse ICD-10 codes (split by comma)
        if (mappedRow?.icd10_codes) {
          mappedRow.icd10_codes = mappedRow?.icd10_codes
            ?.toString()
            ?.split(',')
            ?.map((code: string) => code?.trim())
            ?.filter(Boolean) ?? [];
        }

        // Required fields check
        if (!mappedRow?.last_name || !mappedRow?.date_of_birth) {
          throw new Error('Missing required fields: Last Name or Date of Birth');
        }

        // Find or create patient
        let patient = await findPatientByNameAndDOB(
          mappedRow?.last_name,
          mappedRow?.date_of_birth
        );

        const patientData: any = {
          first_name: mappedRow?.first_name,
          last_name: mappedRow?.last_name,
          gender: mappedRow?.gender,
          date_of_birth: mappedRow?.date_of_birth,
          address: mappedRow?.address,
          insurance_payer: mappedRow?.insurance_payer,
          policy_number: mappedRow?.policy_number,
          icd10_codes: mappedRow?.icd10_codes,
          referring_physician: mappedRow?.referring_physician,
          npi_number: mappedRow?.npi_number,
          clinic_facility: mappedRow?.clinic_facility,
          sales_rep: mappedRow?.sales_rep,
          fax: mappedRow?.fax,
          comments: mappedRow?.comments,
          jg_comments: mappedRow?.jg_comments,
        };

        if (!patient) {
          // Create new patient
          patient = await createPatient(patientData, userId);
        } else {
          // Update existing patient with non-empty values
          const updates: any = {};
          Object.keys(patientData ?? {})?.forEach((key) => {
            const patientKey = key as keyof typeof patient;
            if (patientData?.[key] && !patient?.[patientKey]) {
              updates[key] = patientData?.[key];
            }
          });
          
          if (Object.keys(updates ?? {})?.length > 0) {
            patient = await updatePatient(patient?.id, updates, userId);
          }
        }

        // Create test if test data exists
        if (mappedRow?.test_type && patient?.id) {
          // Check if test already exists for this patient
          const { data: existingTest } = await supabase
            .from('tests')
            .select('*')
            .eq('patient_id', patient?.id)
            .eq('test_type', mappedRow?.test_type)
            .maybeSingle();

          if (!existingTest) {
            const testData: any = {
              patient_id: patient?.id,
              test_type: mappedRow?.test_type,
              accession_id: mappedRow?.accession_id,
              date_of_service: mappedRow?.date_of_service,
              result_in_date: mappedRow?.result_in_date,
              result_fax_date: mappedRow?.result_fax_date,
              claim_status: mappedRow?.claim_status || 'Pending',
              billed_date: mappedRow?.billed_date,
              claim_number: mappedRow?.claim_number,
              charges: mappedRow?.charges ? parseFloat(mappedRow?.charges) : undefined,
              paid: mappedRow?.paid ? parseFloat(mappedRow?.paid) : undefined,
              ded_coins: mappedRow?.ded_coins ? parseFloat(mappedRow?.ded_coins) : undefined,
              patient_responsibility: mappedRow?.patient_responsibility ? parseFloat(mappedRow?.patient_responsibility) : undefined,
              check_eft_number: mappedRow?.check_eft_number,
              check_eft_date: mappedRow?.check_eft_date,
              payment_number: mappedRow?.payment_number,
              payment_date: mappedRow?.payment_date,
              deductible: mappedRow?.deductible ? parseFloat(mappedRow?.deductible) : undefined,
              mr: mappedRow?.mr,
              correction_requests: mappedRow?.correction_requests,
            };

            await createTest(testData, userId);
          }
        }

        successfulRows++;
      } catch (error: any) {
        failedRows++;
        errors.push(`Row ${rowNumber}: ${error?.message || 'Unknown error'}`);
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    // Log import to database
    await supabase.from('excel_import_logs').insert({
      file_name: file.name,
      total_rows: rawData?.length,
      successful_rows: successfulRows,
      failed_rows: failedRows,
      errors: errors?.length > 0 ? errors : null,
      imported_by: userId,
    });

    return NextResponse.json({
      success: true,
      total_rows: rawData?.length,
      successful_rows: successfulRows,
      failed_rows: failedRows,
      errors,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to import file' },
      { status: 500 }
    );
  }
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;

  // If it's already a date string
  if (typeof value === 'string') {
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
