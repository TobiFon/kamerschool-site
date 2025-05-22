export interface Parent {
  id: number;
  name: string;
  phone_number: string;
  secondary_phone_number?: string | null;
  email: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActiveSubjectInfo {
  id: number;
  name: string;
  coefficient: number; // Or string if backend sends it as string
}
export interface StudentSimple {
  id: number;
  matricule: string | null;
  first_name: string;
  last_name: string;
  // Add any other fields absolutely needed for the selection list display
}
export interface Student {
  id: number;
  matricule: string | null; // Can be blank/null initially
  first_name: string;
  last_name: string;
  sex: "m" | "f";
  sex_display?: string; // Read-only from serializer
  date_of_birth: string; // YYYY-MM-DD
  age?: number; // Read-only from serializer
  place_of_birth: string;
  class_name?: string | null; // Read-only from serializer method
  date_of_enrollment?: string; // Read-only from serializer (auto_now_add)
  profile_picture?: string | null; // URL or path
  parent: number; // Parent ID for writing
  parent_name?: string; // Read-only from serializer
  status: "active" | "graduated" | "inactive";
  status_display?: string; // Read-only from serializer
  active_subjects?: ActiveSubjectInfo[]; // Read-only from serializer method
  created_at?: string;
  updated_at?: string;
  // user field is usually not needed directly in frontend forms/lists
}

// Type for creating/updating (omits read-only fields)
export type StudentFormData = Omit<
  Student,
  | "id"
  | "matricule" // Usually assigned by backend
  | "age"
  | "class_name"
  | "date_of_enrollment"
  | "parent_name"
  | "sex_display"
  | "status_display"
  | "active_subjects"
  | "created_at"
  | "updated_at"
> & { profile_picture?: File | null }; // Allow File for upload

// Params for fetching students list
export interface FetchStudentsParams {
  search?: string; // Maps to 'name' filter OR 'matricule__icontains'
  page?: number;
  page_size?: number;
  status?: "active" | "graduated" | "inactive"; // Student's own status
  sex?: "m" | "f";
  minAge?: number; // Maps to 'age_min'
  maxAge?: number; // Maps to 'age_max'
  enrollment_class?: number; // NEW - matches backend filter
  enrollment_year?: number; // NEW - matches backend filter
  enrollment_status?:
    | "pending"
    | "confirmed"
    | "transferred_in"
    | "transferred_out"
    | "withdrawn"; // NEW - matches backend filter
  enrollmentAfter?: string; // YYYY-MM-DD maps to 'enrolled_after' (student's own enrollment date)
  enrollmentBefore?: string; // YYYY-MM-DD maps to 'enrolled_before' (student's own enrollment date)
  parentName?: string; // Maps to 'parent__name__icontains'
  matricule?: string; // Maps to 'matricule__icontains'
  return_simple?: boolean; // Optional: Hint to backend/frontend to return less data
}

// Params for fetching parents list
export interface FetchParentsParams {
  search?: string; // Maps to 'name' or 'email' or 'phone' filter
  page?: number;
  page_size?: number;
}

export interface PerformanceExcerpt {
  period_type: "Sequence" | "Term" | "Year" | null;
  period_name: string | null;
  academic_year: string | null;
  average: number | string | null; // Can be Decimal string from backend
  rank: number | null;
  class_average: number | string | null; // Can be Decimal string
  class_size: number | null;
  pass_status: boolean | null;
  promotion_status?: string | null; // Optional, only for Year
}

export interface FeesSummary {
  total_due: number | string; // Decimal string
  total_paid: number | string; // Decimal string
  balance: number | string; // Decimal string
  academic_year: string;
  message?: string; // Optional message (e.g., no fees)
  error?: string; // Optional error message
}

export interface AttendanceSummary {
  period: string;
  term_name?: string | null; // If applicable
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days_recorded: number;
  message?: string; // Optional message
  error?: string; // Optional error message
}

// Representing the structure returned by StudentOverviewSerializer
export interface StudentOverview {
  id: number; // Or string if UUID
  matricule: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  sex_display: string;
  age: number | null;
  profile_picture: string | null;
  class_id: number | string | null; // Allow string for UUID
  class_name: string | null;
  status_display: string;
  parent_name: string | null;
  parent_phone_number: string | null;

  // Summaries / Excerpts
  latest_performance: PerformanceExcerpt | null;
  current_fees_summary: FeesSummary | null;
  recent_attendance_summary: AttendanceSummary | null;

  // Replace count with the actual list if you modified the serializer
  active_subjects:
    | {
        id: number; // class_subject ID
        subject_id: number; // subject ID
        name: string;
        code?: string; // Optional subject code
        coefficient: number;
        teacher?: string | null; // Optional teacher name
      }[]
    | null;
  // Or keep count if you stick to the serializer in the thought process:
  // active_subjects_count: number;

  created_at: string;
  updated_at: string;
}

// Also update the base Student type if needed to include properties like primary_school or current_class
export interface Student {
  // ... existing fields ...
  parent: Parent | null; // Make sure parent is defined
  user?: { id: number; username: string; email?: string }; // Optional user link
  current_class?: {
    // Optional nested current class info
    id: number | string;
    full_name: string;
    school: { id: number; name: string }; // Include school info if needed by permissions
  } | null;
  primary_school?: {
    // Optional based on your Student model property
    id: number;
    name: string;
  } | null;
  enrollments?: any[]; // Add if needed for permission checks
  // ... any other fields from your full StudentSerializer ...
  subject_enrollments?: any[]; // If needed
  active_subjects?: {
    // Mirror the structure from overview if needed elsewhere
    id: number;
    subject_id: number;
    name: string;
    code?: string;
    coefficient: number;
    teacher?: string | null;
  }[];
}

// Ensure Parent type is defined correctly
export interface Parent {
  id: number;
  name: string;
  phone_number: string;
  secondary_phone_number?: string | null;
  email?: string | null;
  address?: string | null;
  // Add other parent fields if needed
}

export interface SubjectResultDetail {
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
  teacher_name: string | null;
  coefficient: number;
  score: number | string; // Can be number or string like '-' if absent? Backend should clarify. Assuming number for now.
  rank: number | null;
  class_average_subject: number | null;
  remarks: string | null;
  is_published: boolean;
}

export interface OverallPerformanceDetail {
  average: number | null;
  rank: number | null;
  total_points: number | null;
  total_coefficient: number | null;
  class_average_overall: number | null;
  class_size: number | null;
  remarks: string | null;
  is_published: boolean;
}

export interface PeriodInfo {
  id: number | string;
  name: string;
  // Optional fields depending on period type
  term_name?: string;
  academic_year_name?: string;
}

export interface StudentDetailedResults {
  period_info: PeriodInfo;
  overall_performance: OverallPerformanceDetail | null; // Can be null if no overall calculated yet
  subject_breakdown: SubjectResultDetail[];
}

export interface StudentDetailedResultsResponse {
  student_info: {
    id: number | string;
    full_name: string;
    matricule: string | null;
  };
  period_type: "sequence" | "term" | "year" | null; // Type of the returned period
  results: StudentDetailedResults | null; // Can be null if no results found for query
}

export interface SequenceDetail {
  sequence_id: number | string;
  sequence_name: string;
  normalized_score: number | null; // The score out of 20
  weight: number | string; // Keep as string if backend sends Decimal string
  base_score: number; // The original base (e.g., 20, 100)
  is_published: boolean;
  is_absent?: boolean; // Optional: include if backend provides
}

// NEW: Detail for a specific term within a yearly subject result
export interface TermDetail {
  term_id: number | string;
  term_name: string;
  term_average_score: number | null;
  term_rank: number | null;
  is_published: boolean;
}

export interface SubjectResultDetail {
  subject_id: number;
  subject_name: string;
  subject_code: string | null;
  teacher_name: string | null;
  coefficient: number;
  score: number | null; // This is the main score for the period (Sequence Score, Term Avg, Year Avg)
  rank: number | null; // Rank for the subject in this period
  class_average_subject: number | null;
  remarks: string | null;
  is_published: boolean;
  // --- NEW: Conditional Breakdowns ---
  sequence_details?: SequenceDetail[] | null; // Only present for Term results
  term_details?: TermDetail[] | null; // Only present for Year results
}

export interface OverallPerformanceDetail {
  average: number | null;
  rank: number | null;
  total_points: number | null;
  total_coefficient: number | null;
  class_average_overall: number | null;
  class_size: number | null;
  remarks: string | null;
  is_published: boolean;
}

export interface PeriodInfo {
  id: number | string;
  name: string;
  term_name?: string;
  academic_year_name?: string;
}

export interface StudentDetailedResults {
  period_info: PeriodInfo;
  overall_performance: OverallPerformanceDetail | null;
  subject_breakdown: SubjectResultDetail[];
}

export interface StudentDetailedResultsResponse {
  student_info: {
    id: number | string;
    full_name: string;
    matricule: string | null;
  };
  period_type: "sequence" | "term" | "year" | null;
  results: StudentDetailedResults | null;
}

// Represents the data within the 'subject_performance' array
export interface SubjectPerformanceAnalytics {
  subject_name: string;
  coefficient: number | null;
  score: number | null; // The main score for this subject in the period (avg/sequence score)
  class_average: number | null;
  difference: number | null; // Difference from class average
  rank: number | null; // Rank in this subject for the period
  status: string | null; // e.g., "Excellent", "Average", "Needs Improvement"
}

// Represents the overall trend data structure
export interface TrendData {
  slope: number;
  trend_direction: "improving" | "stable" | "declining";
  trend_strength: number;
  next_projection: number | null;
  consistency: number; // Standard Deviation
  consistency_rating: "high" | "medium" | "low" | null;
  acceleration: number;
  acceleration_direction: "accelerating" | "stable" | "decelerating";
}

// Represents the trend data for a specific subject
export interface SubjectTrend {
  subject_name: string;
  trend: TrendData;
  data_points: (number | null)[]; // The actual scores used for the trend
  period_labels: string[]; // The labels (e.g., sequence/term names) for data points
}

// Represents the progress comparison structure
export interface ProgressData {
  previous_period_name: string;
  previous_average: number;
  current_average: number;
  improvement: number;
  percent_change: number | null;
}

// Represents the structure for sequence breakdown within a term result
export interface SequenceBreakdownItem {
  sequence_id: number | string;
  sequence_name: string;
  average: number | null;
  rank: number | null;
  total_points: number | null;
}

// Represents the structure for term breakdown within a year result
export interface TermBreakdownItem {
  term_id: number | string;
  term_name: string;
  average: number | null;
  rank: number | null;
  total_points: number | null; // Added for consistency if available
}

// Main response structure from the /analytics endpoint
export interface StudentPerformanceAnalyticsResponse {
  student_info: {
    id: number | string;
    name: string;
    class: string | null;
  };
  period_info: {
    id: number | string;
    name: string;
    type: "sequence" | "term" | "year";
    term?: string; // Optional: Term name (for sequence/term)
    year: string; // Academic Year name
  };
  overall_performance: {
    average: number | null;
    total_points: number | null;
    total_coefficient: number | null;
    rank: number | null;
    class_size: number | null;
    percentile: number | null;
    class_average: number | null;
    difference_from_class: number | null;
    pass_status: boolean | null;
    remarks: string | null; // Added remarks
  } | null; // Overall performance might be null if no data
  subject_performance: SubjectPerformanceAnalytics[] | null;
  strengths_weaknesses: {
    strongest: SubjectPerformanceAnalytics[] | null;
    weakest: SubjectPerformanceAnalytics[] | null;
  } | null;
  sequence_breakdown?: SequenceBreakdownItem[] | null; // Optional: Only for term analytics
  term_breakdown?: TermBreakdownItem[] | null; // Optional: Only for year analytics
  progress: ProgressData | null; // Comparison to previous period
  trend_analysis: {
    overall: {
      // Trend of overall averages
      performance_history: (number | null)[];
      period_labels: string[];
      trend: TrendData | null;
    } | null;
    sequences_within_term?: {
      // Optional: Only for term analytics
      performance_history: (number | null)[];
      period_labels: string[];
      trend: TrendData | null;
    } | null;
    terms_within_year?: {
      // Optional: Only for year analytics
      performance_history: (number | null)[];
      period_labels: string[];
      trend: TrendData | null;
    } | null;
    subjects: {
      // Dictionary keyed by subject_id (string for JS)
      [key: string]: SubjectTrend;
    } | null;
  } | null;
}
// src/types/attendance.ts

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

// Matches the DailyAttendanceSerializer output
export interface AttendanceRecord {
  id: number;
  student: number; // Student ID
  student_name?: string; // Read-only from serializer
  student_matricule?: string | null; // Read-only from serializer
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  marked_by: number | null; // User ID
  marked_by_username?: string; // Potentially add this to serializer if needed
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// Matches the 'summary' object in the backend response
export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_records_in_period: number;
  days_with_records_in_period: number;
  attendance_rate: number | null; // Percentage
  filters_applied: {
    date_from: string | null;
    date_to: string | null;
    status: string | null;
  };
}

// Matches the overall structure returned by the student attendance endpoint
export interface StudentAttendanceResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AttendanceRecord[];
  summary: AttendanceSummary;
}

// types/students.ts

// ... other types ...

export interface EnrollmentHistoryEntry {
  academic_year_id: number;
  academic_year_name: string;
  class_name: string; // Class name for that year
  // Add school_name if needed: school_name: string;
}

export interface StudentOverview {
  // ... existing fields like id, matricule, full_name, etc.
  id: string; // or number, depending on your backend ID type
  matricule: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string; // Assuming YYYY-MM-DD string format
  sex_display: string;
  age: number | null;
  profile_picture: string | null;
  class_id: number | null;
  class_name: string | null; // This will now reflect the LATEST class by default
  school_name: string | null; // This will now reflect the LATEST school by default
  status_display: string;
  parent_name: string | null;
  parent_phone_number: string | null;
  latest_performance: PerformanceSummary | null;
  current_fees_summary: FeeSummary | null; // Still reflects active year
  academic_year_attendance_summary: AttendanceSummary | null; // Reflects selected/latest year
  academic_year_discipline_summary: DisciplineSummary | null; // Reflects selected/latest year
  enrolled_subjects: SubjectEnrollment[]; // Reflects selected/latest year
  enrolled_subjects_count: number; // Reflects selected/latest year
  created_at: string;
  updated_at: string;

  // --- NEW FIELD ---
  enrollment_history: EnrollmentHistoryEntry[]; // Add this field
}

// Ensure PerformanceSummary, FeeSummary, AttendanceSummary, DisciplineSummary, SubjectEnrollment types exist
// Example stubs if they don't:
export interface PerformanceSummary {
  period_type: string;
  period_name: string;
  academic_year: string;
  average: number | null;
  rank: number | null;
  class_average: number | null;
  class_size: number | null;
  pass_status: boolean | null;
  promotion_status?: string | null; // Optional
}

export interface FeeSummary {
  total_due: number | string; // Use string if backend sends Decimal as string
  total_paid: number | string;
  balance: number | string;
  academic_year: string;
  message?: string; // Optional message like 'not enrolled'
  error?: string; // Optional error
}

// AttendanceSummary already defined in AttendanceTab file, ensure it matches backend
// DisciplineSummary needs definition
export interface DisciplineSummary {
  academic_year: string;
  total_records: number;
  incidents: number;
  merits: number;
  message?: string; // Optional message
}

// SubjectEnrollment can be simple
export interface SubjectEnrollment {
  id: number;
  name: string;
  coefficient: number | string; // Allow string if backend sends Decimal as string
}

// ... other existing types like Student, Parent, StudentFormData etc. ...
