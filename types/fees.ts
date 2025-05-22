export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages?: number; // Add if backend provides it
  current_page?: number; // Add if backend provides it
}

// Simple option for dropdowns
export interface SimpleOption {
  value: string | number;
  label: string;
}

// More specific option types if needed
export interface SimpleClassOption {
  id: number;
  full_name: string; // Make sure backend provides this if used
}
export interface SimpleAcademicYearOption {
  id: number;
  name: string;
}

// --- Fee Management Types ---

export interface FeeType {
  id: number;
  school: number; // ID of the school
  school_name: string; // Name of the school (read-only)
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export interface ClassFee {
  id: number;
  academic_year: number; // ID
  academic_year_name: string; // Read-only name
  class_instance: number; // ID
  class_name: string; // Read-only name (full_name)
  fee_type: number; // ID
  fee_type_name: string; // Read-only name
  amount: string; // Use string for decimal precision from backend
  due_date?: string | null; // ISO date string or null
  installment_allowed: boolean;
  max_installments?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Basic Student type (expand as needed from StudentSerializer)
export interface SimpleStudent {
  id: number;
  user: number; // Assuming user FK
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  matricule?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  full_name: string; // Property from backend model/serializer
  primary_school?: number | null; // Assuming this exists
  // Add other relevant fields from StudentSerializer
}

export interface Payment {
  id: number;
  student_fee: number; // ID
  student_name: string; // Read-only convenience field
  fee_type_name: string; // Read-only convenience field
  amount: string; // Use string for decimal
  payment_date: string; // ISO date string (YYYY-MM-DD)
  payment_method: string; // e.g., 'cash', 'bank_transfer'
  payment_method_display: string; // Read-only display name
  reference_number?: string | null;
  received_by: number | null; // ID of the User who recorded it, or null
  received_by_name: string; // Read-only User's name/username or 'N/A'
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFee {
  id: number;
  student: number; // FK ID for write ops, or nested object in detail view
  student_id: number; // Read-only ID from serializer
  student_name: string; // Read-only name from serializer
  class_fee: number | ClassFee; // FK ID for write ops, or nested object in detail view
  fee_type_name: string; // Read-only name
  fee_type_id: number; // Added ID field
  academic_year_id: number; // Added ID field
  class_instance_id: number; // Added ID field
  amount: string; // Use string for decimal
  amount_paid: string; // Use string for decimal
  balance: string; // Read-only string representation
  status: "pending" | "partial" | "paid" | "overdue" | "waived"; // Keep original key
  status_display: string; // Read-only display name
  due_date?: string | null; // Read-only, from ClassFee
  waiver_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;

  // Fields from StudentFeeDetailSerializer (nested objects)
  // Use ClassFee type directly if the serializer nests the full object
  class_fee_details?: ClassFee; // Renamed for clarity if needed, matches ClassFee type
  // Use SimpleStudent or a more detailed Student type if StudentSerializer is complex
  student_details?: SimpleStudent;
  payments?: Payment[]; // List of payments
}

// --- Dashboard & Summary Types ---

export interface FeeStatusCounts {
  pending: number;
  partial: number;
  paid: number;
  overdue: number;
  waived: number;
  // Include other statuses if added
  [key: string]: number; // Allow dynamic keys
}

export interface OverallFeeStats {
  total_fees: string; // Use string for decimal
  total_collected: string; // Use string for decimal
  total_pending: string; // Use string for decimal
  total_overdue: string; // Use string for decimal
  collection_rate: number; // Percentage
  fee_status_counts: FeeStatusCounts;
  error?: string | null; // Error message if calculation failed
}

export interface FeeStatsByType {
  fee_type_id: number;
  fee_type_name: string;
  total_amount: string; // Use string for decimal
  collected_amount: string; // Use string for decimal
  pending_amount: string; // Use string for decimal
  collection_rate: number; // Percentage
  student_count: number;
}

export interface FeeStatsByClass {
  class_id: number;
  class_name: string;
  total_amount: string; // Use string for decimal
  collected_amount: string; // Use string for decimal
  pending_amount: string; // Use string for decimal
  collection_rate: number; // Percentage
  student_count: number;
}

export interface RecentPayment extends Payment {
  // Fields are likely the same as Payment, but redefine if API differs
  payment_id: number; // Alias if needed from backend response
}

export interface PaymentTrendPoint {
  month: string; // e.g., "Jan 2024"
  amount: string; // Use string for decimal
}

export interface FeeDashboardData {
  overall_stats: OverallFeeStats;
  stats_by_type: FeeStatsByType[];
  stats_by_class: FeeStatsByClass[];
  recent_payments: RecentPayment[];
  payment_trends: PaymentTrendPoint[];
}

// Type for Student Fee Summary API response
export interface StudentFeeSummary {
  student_id: number;
  student_name: string;
  student_matricule?: string | null;
  current_class_name?: string | null;
  academic_year: {
    // Nested academic year info
    id: number;
    name: string;
  };
  school: {
    // Nested school info
    id: number;
    name: string;
  };
  summary: {
    // Grouped summary figures
    total_fees: string; // Use string for decimal
    total_paid: string; // Use string for decimal
    total_balance: string; // Use string for decimal
    payment_progress: number; // Percentage
  };
  fee_details: StudentFee[]; // Use the StudentFee structure (or a simplified one)
  payment_history: Payment[]; // Use the Payment structure
}

// --- Payload Types (for POST/PUT/PATCH) ---

export interface FeeTypePayload {
  name: string;
  description?: string;
  is_active: boolean;
  // school_id?: number; // Only needed if a superuser is creating and needs to specify
}

export interface ClassFeePayload {
  academic_year: number;
  class_instance: number;
  fee_type: number;
  amount: number; // Send as number, backend handles Decimal
  due_date?: string | null; // Format as "YYYY-MM-DD"
  installment_allowed: boolean;
  max_installments?: number | null;
  notes?: string;
}

export interface AssignFeesPayload {
  student_ids: number[];
  custom_amount?: number | null; // Send number or null
}

export interface WaiveFeePayload {
  reason: string;
}

export interface UpdateStudentFeePayload {
  notes?: string; // Primarily for updating notes
  // Add other updatable fields if necessary (e.g., custom amount *if* allowed post-creation)
}

export interface MakePaymentPayload {
  student_id: number;
  fee_type_id: number; // Used by backend to find ClassFee -> StudentFee
  academic_year_id?: number | null; // Optional, defaults to current year on backend
  amount: number; // Send as number
  payment_date: string; // Format as "YYYY-MM-DD"
  payment_method: string; // e.g., 'cash'
  reference_number?: string | null;
  notes?: string | null;
}

// Add PaymentMethodChoices explicitly if needed on frontend
export const PaymentMethodChoices: SimpleOption[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" },
];
export type FeeStatus = "pending" | "partial" | "paid" | "overdue" | "waived";
export type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "mobile_money"
  | "check"
  | "other";

// Matches the StudentFeeSerializer output (ensure fields match backend)
export interface StudentFeeRecord {
  id: number;
  student: number; // student ID (write only usually, but maybe needed for key)
  student_id: number;
  student_name?: string;
  class_fee: number; // class fee ID (write only usually)
  fee_type_name?: string;
  fee_type_id?: number; // Added for consistency
  academic_year_id?: number; // Added
  class_instance_id?: number; // Added
  amount: number | string; // Use string if backend sends Decimal string
  amount_paid: number | string;
  balance: number | string;
  status: FeeStatus;
  status_display?: string;
  due_date: string | null; // YYYY-MM-DD
  waiver_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Matches the PaymentSerializer output
export interface PaymentRecord {
  id: number;
  student_fee: number; // StudentFee ID
  student_name?: string; // Added
  fee_type_name?: string; // Added
  amount: number | string;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  payment_method_display?: string;
  reference_number: string | null;
  received_by: number | null; // User ID
  received_by_name?: string | null; // Added
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Structure for paginated results within the main response
interface PaginatedList<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Matches the overall response structure of student_fees_tab_data endpoint
export interface StudentFeesTabDataResponse {
  student_info: {
    id: number | string;
    full_name: string;
    matricule: string | null;
  };
  academic_year: {
    id: number | string;
    name: string;
    is_active: boolean;
  };
  summary: {
    total_fees_amount: number | string;
    total_amount_paid: number | string;
    total_balance_due: number | string;
    payment_progress_percentage: number | string;
  };
  fee_details: PaginatedList<StudentFeeRecord>;
  payment_history: PaginatedList<PaymentRecord>;
}

// Type for Paginated Response (Generic - maybe move to a central types file)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
