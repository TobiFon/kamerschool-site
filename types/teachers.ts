export interface TeacherPerformance {
  teacher_info: {
    id: number;
    name: string;
    email: string;
  };
  overall_metrics: {
    average_score: number;
    pass_rate: number;
    total_students: number;
    grade_distribution: {
      excellent: number;
      good: number;
      average: number;
      below_average: number;
    };
  };
  subject_breakdown: Array<{
    subject_id: number;
    subject_name: string;
    class_performance: Array<{
      class_id: number;
      class_name: string;
      avg_score: number;
      pass_rate: number;
      total_students: number;
      grade_distribution: {
        excellent: number;
        good: number;
        average: number;
        below_average: number;
      };
    }>;
  }>;
  term_trends: Array<{
    term_name: string;
    avg_score: number;
    pass_rate: number;
  }>;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Teacher list response from the API
 */
export interface TeacherListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Teacher[];
}

/**
 * Teacher form data for create/update operations
 */
export interface TeacherFormData {
  name: string;
  email: string;
  phone_number: string;
  picture?: File | null;
}

// Types for the teacher and class subject data
export interface Subject {
  id: number;
  name: string;
}

export interface ClassSubject {
  id: number;
  school_class: number;
  subject: number;
  teacher: number | null;
  subject_name?: string;
  class_name?: string;
}

export interface Class {
  id: number;
  name: string;
  year: number;
}

export interface ClassWithSubjects extends Class {
  class_subjects: ClassSubject[];
}

export interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  class_subjects: ClassSubject[];
}
