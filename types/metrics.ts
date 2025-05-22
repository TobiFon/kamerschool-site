export interface SchoolMetrics {
  school_name: string;
  class_metrics: {
    total_classes: number;
    average_students_per_class: number;
  };
  student_metrics: {
    total_students: number;
  };
  teacher_metrics: {
    total_teachers: number;
  };
  education_system_breakdown: {
    [educationSystem: string]: {
      classes: number;
      students: number;
    };
  };
}

export interface AttendanceOverview {
  total_students: number;
  total_school_days: number;
  attendance_rate: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  expected_records: number;
  recorded_records: number;
}

export interface DailyTrend {
  date: string; // Date in ISO string format
  attendance_rate: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  total_students: number;
  missing_records: number;
}

export interface MonthlyTrend {
  month: string; // e.g., "2024-02"
  attendance_rate: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  school_days: number;
  missing_records: number;
  expected_records: number;
}

export interface DayOfWeekTrend {
  day_of_week: string;
  day_number: number;
  attendance_rate: number;
  day_count: number;
  average_attendance: number;
  average_students: number;
}

export interface LowAttendanceDays {
  count: number;
  days: DailyTrend[];
  threshold: number;
}

export interface ChronicAbsence {
  student_id: number;
  name: string;
  matricule: string;
  absences: number;
  percentage: number;
}

export interface ChronicAbsences {
  threshold_days: number;
  students: ChronicAbsence[];
  count: number;
}

export interface AttendanceMetrics {
  overview: AttendanceOverview;
  by_class: any[];
  daily_trends: DailyTrend[];
  monthly_trends: MonthlyTrend[];
  day_of_week_trends: DayOfWeekTrend[];
  low_attendance_days: LowAttendanceDays;
  chronic_absences: ChronicAbsences;
}

// types/schoolPerformance.ts

export interface SchoolPerformanceOverviewProps {
  current_term: {
    name: string;
    academic_year: string;
  };
  overall_metrics: {
    overall_average: number;
    pass_rate: number;
    total_students_evaluated: number;
    highest_average: number;
    lowest_average: number;
  };
  grade_distribution: {
    excellent: number;
    good: number;
    average: number;
    below_average: number;
  };
  top_performing_subjects: Array<{
    student_subject__class_subject__subject__name: string;
    avg_score: number;
  }>;
  lowest_performing_subjects: Array<{
    student_subject__class_subject__subject__name: string;
    avg_score: number;
  }>;
  class_performance: Array<{
    class_id: number;
    class_name: string;
    avg_score: number;
    student_count: number;
    pass_rate: number;
  }>;
}

export interface SubjectPerformanceType {
  name: string;
  average_score: number;
  pass_rate: number;
}
