// src/types/timetable.ts

// --- TimeSlot Types (No changes here from previous backend updates) ---
export interface TimeSlot {
  id: number;
  school_name?: string;
  name: string;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string; // "HH:MM:SS" or "HH:MM"
  order: number;
  is_break: boolean;
  duration_display?: string;
}

export type TimeSlotFormData = Omit<
  TimeSlot,
  "id" | "school_name" | "duration_display"
> & {
  school_id?: number;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
};

// --- ClassTimetable Types (No structural changes here, but nested TimetableEntry will change) ---
export interface SimpleSchoolClass {
  id: number;
  full_name: string;
}

export interface SimpleAcademicYear {
  id: number;
  name: string;
}

export interface ClassTimetable {
  id: number;
  school_class: SimpleSchoolClass;
  academic_year: SimpleAcademicYear;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  entries?: TimetableEntry[]; // This will now contain entries with 'scheduled_subjects'
}

export type ClassTimetableFormData = Omit<
  ClassTimetable,
  | "id"
  | "school_class"
  | "academic_year"
  | "created_at"
  | "updated_at"
  | "entries"
> & {
  school_class_id: number | string;
  academic_year_id: number | string;
};

// --- TimetableEntry Types (MODIFIED) ---

// Helper type for ClassSubject details within ScheduledClassSubject
export interface SimpleSubjectForTimetable {
  id: number;
  name: string;
  code?: string;
}

export interface SimpleTeacherForTimetable {
  id: number;
  name: string;
}

export interface NestedClassSubjectDetails {
  // Renamed for clarity
  id: number; // ID of the ClassSubject
  subject: SimpleSubjectForTimetable;
  teacher: SimpleTeacherForTimetable | null; // Teacher can be null on ClassSubject
  coefficient: number;
  mandatory: boolean;
}

// New interface for a subject scheduled within a slot
export interface ScheduledClassSubject {
  id: number; // ID of the ScheduledClassSubject record
  class_subject: NestedClassSubjectDetails;
  // room?: string; // Optional: if added to backend model
  // specific_notes?: string; // Optional: if added to backend model
}

export interface TimetableEntry {
  // Represents a "slot"
  id: number;
  day_of_week: number;
  day_of_week_display: string;
  time_slot: TimeSlot; // Nested TimeSlot details for display
  notes?: string | null; // Notes for the slot itself
  scheduled_subjects: ScheduledClassSubject[]; // MODIFIED: Array of subjects in this slot
}

// FormData for creating/updating a TimetableEntry (a slot)
export type TimetableEntryFormData = Omit<
  TimetableEntry,
  // Removed class_subject, teacher. `scheduled_subjects` is managed separately.
  "id" | "day_of_week_display" | "time_slot" | "scheduled_subjects"
> & {
  class_timetable_id: number; // FK
  time_slot_id: number | string;
};

// New FormData for scheduling a subject into a slot
export type ScheduledClassSubjectFormData = {
  timetable_entry_id: number | string; // The slot to schedule into
  class_subject_id: number | string; // The ClassSubject to schedule
  // room?: string; // Optional
  // specific_notes?: string; // Optional
};

// For creating multi-period entries (MODIFIED)
export type MultiPeriodEntryFormData = {
  class_timetable_id: number;
  day_of_week: number;
  start_time_slot_id: number | string;
  num_periods: number;
  class_subject_id: number | string; // The ClassSubject to schedule across periods
  // teacher_id is REMOVED
  notes?: string | null; // Notes for the TimetableEntry (slots) being created
};

// --- New Type for Teacher Schedule View ---
export interface TeacherScheduleEntry {
  id: number; // ID of the ScheduledClassSubject record
  day_of_week: number;
  day_of_week_display: string;
  time_slot_name: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  school_class_id: number;
  school_class_name: string;
  class_subject_id: number;
  subject_name: string;
  subject_code: string;
  slot_notes?: string | null;
}

// --- Paginated Responses (Adjusted if needed) ---
export interface PaginatedTimeSlotsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TimeSlot[];
}

export interface PaginatedClassTimetablesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassTimetable[];
}

// Paginated response for TimetableEntry (slots)
export interface PaginatedTimetableEntriesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TimetableEntry[];
}

// Paginated response for ScheduledClassSubject
export interface PaginatedScheduledClassSubjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ScheduledClassSubject[];
}

// --- Filter Params for API calls (Adjusted) ---
export interface FetchTimeSlotsParams {
  page?: number;
  pageSize?: number;
  school_id?: number | string;
  ordering?: string;
}

export interface FetchClassTimetablesParams {
  page?: number;
  pageSize?: number;
  school_id?: number | string;
  class_pk?: number | string;
  academic_year_pk?: number | string;
  is_active?: boolean | string;
  ordering?: string;
}

// Params for fetching TimetableEntry (slots)
export interface FetchTimetableEntriesParams {
  page?: number;
  pageSize?: number;
  class_timetable_pk?: number | string; // Filter slots by timetable
  day_of_week?: number | string;
  ordering?: string;
}

// Params for fetching ScheduledClassSubject instances
export interface FetchScheduledClassSubjectsParams {
  page?: number;
  pageSize?: number;
  timetable_entry_pk?: number | string; // Filter scheduled subjects by a specific slot
  class_subject_pk?: number | string; // Filter by a specific class subject
  ordering?: string;
}

// For Teacher Schedule View
export interface FetchTeacherScheduleParams {
  teacher_id: number | string;
  academic_year_id: number | string;
}

// For Class Active Schedule View
export interface FetchClassActiveScheduleParams {
  class_id: number | string;
  academic_year_id: number | string;
}

// src/types/timetable.ts

// --- Existing types (TimeSlot, SimpleSchoolClass, SimpleAcademicYear, etc.) ---
// ... (ensure these are present as per your existing file) ...

export interface SimpleSubjectForTimetable {
  id: number;
  name: string;
  code?: string;
}

export interface SimpleTeacherForTimetable {
  id: number;
  name: string;
}

export interface NestedClassSubjectDetails {
  id: number; // ID of the ClassSubject
  subject: SimpleSubjectForTimetable;
  teacher: SimpleTeacherForTimetable | null; // Default teacher from ClassSubject
  coefficient?: number;
  mandatory?: boolean;
}

export interface ScheduledClassSubject {
  // Ensure this matches backend (already updated previously)
  id: number;
  class_subject: NestedClassSubjectDetails;
  assigned_teacher: SimpleTeacherForTimetable | null;
  effective_teacher: SimpleTeacherForTimetable | null;
  effective_teacher_id: number | null;
  effective_teacher_name: string | null;
}

export interface TimeSlot {
  // Assuming this exists
  id: number;
  school_name?: string;
  name: string;
  start_time: string;
  end_time: string;
  order: number;
  is_break: boolean;
  duration_display?: string;
}

export interface TimetableEntry {
  // Base slot structure
  id: number;
  day_of_week: number;
  day_of_week_display: string;
  time_slot: TimeSlot;
  notes?: string | null;
  scheduled_subjects: ScheduledClassSubject[];
}

export interface TeacherScheduleEntry {
  id: number; // ID of the ScheduledClassSubject record
  day_of_week: number;
  day_of_week_display: string;
  time_slot_name: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  school_class_id: number;
  school_class_name: string;
  class_subject_id: number;
  subject_name: string;
  subject_code: string;
  slot_notes?: string | null;
  teaching_teacher_id: number | null; // From effective_teacher.id
  teaching_teacher_name: string | null; // From effective_teacher_name
}
export interface PaginatedTeacherScheduleResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TeacherScheduleEntry[];
}
export interface FetchTeacherScheduleParams {
  // Already defined
  teacher_id: number | string;
  academic_year_id: number | string;
}

// --- Student Individual Timetable ---
// Type for a single slot in the student's specific timetable
// This reuses TimetableEntry but scheduled_subjects will be filtered
export type StudentTimetableSlotEntry = TimetableEntry; // It has the same structure

// Type for the API response for a student's timetable
export interface StudentTimetableResponse {
  student_id: number;
  student_name: string;
  class_name: string | null;
  academic_year_name: string;
  timetable_id: number | null; // ID of the source ClassTimetable
  entries: StudentTimetableSlotEntry[];
  message?: string; // Optional message (e.g., "Not enrolled")
}

export interface FetchStudentTimetableParams {
  student_id: number | string;
  academic_year_id: number | string;
}
