export type DisciplineCategory =
  | "incident"
  | "merit"
  | "observation"
  | "sanction"
  | "other";

export type DisciplineSeverity = "low" | "medium" | "high" | "info" | "n/a"; // Match backend choices exactly

// Interface representing a single Discipline Record received from the API
export interface DisciplineRecord {
  id: number;
  student: number; // Foreign Key ID
  student_name?: string; // Read-only, added by serializer
  student_matricule?: string | null; // Read-only, added by serializer, can be null
  record_type: number; // Foreign Key ID
  record_type_name?: string; // Read-only, added by serializer
  record_category?: DisciplineCategory; // Read-only, added by serializer
  record_category_display?: string; // Read-only, added by serializer
  is_positive_record?: boolean; // Read-only, added by serializer
  school: number; // Read-only, auto-set by backend
  school_name?: string; // Read-only, added by serializer
  academic_year: number | null; // Read-only, auto-set by backend, can be null if no matching year found
  academic_year_name?: string | null; // Read-only, added by serializer, can be null
  date_occurred: string; // YYYY-MM-DD format string
  time_occurred: string | null; // HH:MM:SS format string or null
  severity: DisciplineSeverity | null; // Can be null if not set or not applicable
  severity_display?: string; // Read-only, added by serializer
  description: string;
  action_taken: string | null; // Can be null or empty string
  reported_by: number | null; // Read-only, auto-set by backend, can be null
  reported_by_name?: string | null; // Read-only, added by serializer, can be null
  created_at: string; // ISO 8601 format string
  updated_at: string; // ISO 8601 format string
}

// Interface for the paginated response structure from the list endpoints
export interface PaginatedDisciplineResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DisciplineRecord[];
}

// Interface representing a Discipline Record Type received from the API
export interface DisciplineRecordType {
  id: number;
  school: number; // Read-only, auto-set by backend (or required for superuser create)
  school_name?: string; // Read-only, added by serializer
  name: string;
  category: DisciplineCategory;
  category_display?: string; // Read-only, added by serializer
  is_positive: boolean; // Can be set, but often defaults based on category
  default_severity: DisciplineSeverity | null; // Can be null
  default_severity_display?: string; // Read-only, added by serializer
  description?: string | null; // Optional text field
  is_active: boolean;
  // created_at / updated_at are usually present but often not needed in frontend logic for types
}

// --- Type for the data needed when CREATING or UPDATING a record via the form/modal ---
// This excludes fields that are read-only or automatically set by the backend.
export type DisciplineRecordFormData = Omit<
  DisciplineRecord, // Start with the full record type
  // List fields to exclude:
  | "id" // Excluded on create, present for update target
  | "student_name" // Read-only display field
  | "student_matricule" // Read-only display field
  | "record_type_name" // Read-only display field
  | "record_category" // Read-only display field (derived from record_type)
  | "record_category_display" // Read-only display field
  | "is_positive_record" // Read-only display field (derived from record_type)
  | "school" // Read-only (auto-set by backend)
  | "school_name" // Read-only display field
  | "academic_year" // Read-only (auto-set by backend based on date_occurred)
  | "academic_year_name" // Read-only display field
  | "severity_display" // Read-only display field
  | "reported_by" // Read-only (auto-set by backend)
  | "reported_by_name" // Read-only display field
  | "created_at" // Read-only audit field
  | "updated_at" // Read-only audit field
> & {
  // Redefine writable fields if their type needs adjustment for form input
  student: number | string; // Allow string input initially from form, convert to number before sending
  record_type: number | string; // Allow string input initially from form, convert to number before sending
  // Severity can be null or one of the allowed values
  severity: DisciplineSeverity | null | ""; // Allow empty string from select before converting to null
  // time_occurred might be handled as string 'HH:MM' from input type="time"
  time_occurred?: string | null; // Optional time
  action_taken?: string | null; // Optional action
};

// Type for parameters used in fetching record types (optional, for clarity)
export interface FetchRecordTypesParams {
  is_active?: boolean; // Filter by active status (though /active-types/ endpoint does this)
  category?: DisciplineCategory | string; // Filter by category
  school_id?: number | string; // Filter by school (for superuser)
  // Add other potential filters if needed
}
export interface PaginatedRecordTypesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DisciplineRecordType[];
}

// --- Type for creating/updating a Record Type via form ---
// Excludes read-only fields, includes writable fields.
export type DisciplineTypeFormData = Omit<
  DisciplineRecordType,
  | "id" // Excluded on create
  | "school" // Usually set by backend based on user
  | "school_name" // Read-only
  | "category_display" // Read-only
  | "default_severity_display" // Read-only
  // created_at / updated_at are implicit
> & {
  // Ensure optional fields are handled correctly if needed
  default_severity?: DisciplineSeverity | null | ""; // Allow empty string from form
  description?: string | null | ""; // Allow empty string from form
  // school field might be needed for superuser create
  school?: number | string | null; // Optional: only if superuser needs to specify
};
