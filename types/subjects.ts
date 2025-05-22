// types/subjectPerformance.ts
export interface SubjectPerformance {
  subject_id: number;
  subject_name: string;
  average_score: number;
  pass_rate: number;
  total_students: number;
  grade_distribution: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
  };
  class_performance: Array<{
    class_id: number;
    class_name: string;
    avg_score: number;
    student_count: number;
  }>;
}
