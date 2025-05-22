// types/transfers.ts

// Keep MinimalSchool and MinimalStudent interfaces as they are (match backend)
interface MinimalSchool {
  id: number;
  name: string;
  name_abrev?: string; // Optional based on serializer
  city?: string; // Optional based on serializer
}

interface MinimalStudent {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  matricule: string | null;
}

// Interface for AcademicYear (used in props)
export interface AcademicYear {
  id: number;
  name: string;
  is_active: boolean;
  // add other fields if needed
}

// Interface for Target Class lookup
export interface TargetClass {
  id: number;
  full_name: string; // From FullClassSerializer
  // Add other fields if needed from FullClassSerializer (e.g., level, stream)
  level?: string;
  stream?: string | null;
  section?: string | null;
}

// Updated TransferRequest matching TransferRequestListSerializer
export interface TransferRequest {
  id: number;
  student: MinimalStudent;
  from_school: MinimalSchool;
  to_school: MinimalSchool;
  from_school_id: number; // Included from serializer
  to_school_id: number; // Included from serializer
  effective_academic_year: string; // String name
  effective_academic_year_id: number; // Included from serializer
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  status_display: string;
  request_date: string;
  review_date?: string | null;
  completion_date?: string | null;
  transfer_reason: string; // Available for Review modal context
  requested_by?: string | null; // String name

  // Snapshot display fields for List/Table
  previous_level_display: string | null;
  last_promotion_status_display: string | null;

  // Include fields needed for other modals/actions if not fetching detail separately
  last_class_at_from_school_id?: number | null; // Needed for suggestion logic trigger
  last_promotion_decision_id?: number | null; // Needed for suggestion logic trigger

  // Fields needed for TransferSuggestionService context (usually available on list/detail)
  // These might be nested objects if the serializer includes them, or might require fetching detail
  // For simplicity, let's assume they are available minimally if needed for suggestions
  // (Backend service actually uses the FKs `last_class_at_from_school` and `last_promotion_decision`)
  // Example structure if needed directly (match your actual serializer output):
  last_class_at_from_school?: {
    id: number;
    level: string;
    education_system: {
      id: number;
      code: string;
      is_english: boolean;
      is_technical: boolean;
    };
  } | null;
  last_promotion_decision?: {
    id: number; // Or just the status is enough if backend handles the rest
    promotion_status: string;
  } | null;
  last_yearly_average?: string | number | null; // String if coerced
  previous_education_system_display?: string | null; // From detail serializer or snapshot
}

// Optional: Define TransferRequestDetail if you use a separate detail fetch/serializer
export interface TransferRequestDetail extends TransferRequest {
  // Inherits fields from TransferRequest, override/add more detail as needed
  // Example using more detailed types if available
  // student: FullStudent;
  // from_school: FullSchool;
  // to_school: FullSchool;
  effective_academic_year: AcademicYear; // Full object maybe
  last_class_at_from_school?: TargetClass | null; // Use TargetClass if it matches FullClassSerializer
  final_class_at_to_school?: TargetClass | null;
  // last_promotion_decision?: PromotionDecisionDetail | number | null; // Depending on backend detail serializer
  last_yearly_average: string | number | null; // Raw value
  reviewed_by?: string | null;
  completed_by?: string | null;
  from_school_notes?: string;
  to_school_notes?: string;
  internal_processing_notes?: string; // Includes suggestion hints
  academic_records_snapshot?: Record<string, any>; // Raw JSON

  // Add snapshot display fields if not already in base TransferRequest
  previous_class_level_display: string | null; // Ensure these are here
  previous_education_system_display: string | null;
  last_promotion_status_display: string | null;
  last_yearly_average_display?: string | null; // Formatted display
}
