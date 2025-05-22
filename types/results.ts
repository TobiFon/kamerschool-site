// Define types based on API responses
export interface ClassSubject {
  id: number;
  school_class: number;
  subject: number;
  subject_name: string;
  subject_code: string;
  class_name: string;
  teacher: number | null;
  teacher_name: string | null;
  coefficient: number;
  mandatory: boolean;
  enrolled_students_count: number;
  created_at: string;
  updated_at: string;
}

export interface StudentScore {
  student_id: number;
  student_name: string;
  student_subject_id: number;
  score: number;
  rank: number | null;
  is_absent: boolean;
  is_published: boolean;
}

export interface SubjectScoreResponse {
  sequence_class_subject_id: number;
  base_score: number;
  weight: number;
  class_subject_id: number;
  subject_name: string;
  class_name: string;
  teacher: number | null;
  coefficient: number;
  results: StudentScore[];
}

export interface SubjectTabProps {
  sequenceId: string | number;
  classId: string | number;
  getAverageBg: (score: number) => string;
  handlePublishSelected: (publish: boolean) => void;
  handleToggleSubjectPublish: (
    subjectId: number,
    studentIds: number[],
    publish: boolean
  ) => void;
}

export interface StudentEnrollmentHistoryItem {
  academic_year: number; // or AcademicYear object
  academic_year_name: string;
  school_id: number;
  school_name: string;
  class_id: number;
  class_name: string;
  status: string; // 'confirmed', 'transferred_out', etc.
}

//sequence types

export interface Sequence {
  id: number;
  name: string;
  school: number;
  created_at: string;
  updated_at: string;
  term: number;
  sequence_type: string;
}
