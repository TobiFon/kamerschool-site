export interface ClassPerformance {
  class_id: number;
  class_name: string;
  avg_score: number;
  student_count: number;
  pass_rate: number;
}

export interface ClassItem {
  id: number;
  school: number;
  level: string;
  level_display: string;
  stream: string | null;
  stream_display: string | null;
  section: string;
  section_display: string;
  description: string;
  full_name: string;
  mandatory_subjects: {
    id: number;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface ClassList {
  count: number;
  next: string | null;
  previous: string | null;
  results: ClassItem[];
}

export interface ClassInfo {
  name: string;
  school: string;
  academic_year: string;
  term: string;
}

export interface OverallPerformance {
  class_average: number;
  pass_rate: number;
  highest_average: number;
  lowest_average: number;
  total_students: number;
}

export interface SubjectPerformance {
  student_subject__class_subject__subject__name: string;
  avg_score: number;
  pass_rate: number;
}

export interface TopStudent {
  student__id: number;
  student__first_name: string;
  student__last_name: string;
  average: number;
  rank: number;
}

export interface GradeDistribution {
  excellent: number;
  good: number;
  average: number;
  below_average: number;
}

export interface ClassPerformance {
  class_info: ClassInfo;
  overall_performance: OverallPerformance;
  subject_performance: SubjectPerformance[];
  top_students: TopStudent[];
  grade_distribution: GradeDistribution;
}

export interface EducationSystem {
  id: number;
  name: string; // e.g., "english"
  code: string; // e.g., "en"
  description: string;
}

export interface Subject {
  id: number;
  name: string; // e.g., "Biology - Form 1 A (School Name) - Teacher Name"
}

export interface Class {
  id: number;
  school: number;
  education_system: EducationSystem;
  level: string; // e.g., "form_1"
  stream: string | null;
  section: string | null; // e.g., "A" or "B"
  description: string;
  full_name: string; // e.g., "Form 1 A"
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  mandatory_subjects: Subject[];
}

export interface ClassesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Class[];
}
export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  matricule: string;
  sex: string;
  sex_display?: string;
  date_of_birth: string;
  date_of_enrollment: string;
  status: string;
  status_display?: string;
  profile_picture?: string;
  parent?: number;
  parent_name?: string;
  age?: number;
  place_of_birth?: string;
}

export interface ClassSubject {
  id: number;
  subject: number;
  subject_name: string;
  teacher: number;
  teacher_name: string;
  coefficient: number;
  mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  name: string;
}

export interface EducationSystem {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface ClassDetails {
  id: number;
  school: number;
  education_system: EducationSystem;
  level: string;
  stream: string | null;
  section: string;
  description: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  mandatory_subjects?: Subject[];
  class_subjects?: ClassSubject[];
  students: Student[];
}
