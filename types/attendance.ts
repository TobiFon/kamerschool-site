export interface ClassWeeklyAttendanceResponse {
  class_id: string;
  class_name: string;
  week: {
    start: string;
    end: string;
    dates: string[];
  };
  navigation: {
    prev_week: string;
    next_week: string;
    current_week: string;
  };
  summary: {
    total_students: number;
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    missing_records: number;
    attendance_rate: number;
  };
  students: StudentAttendance[];
}

export interface StudentAttendance {
  student_id: number;
  matricule: string;
  name: string;
  attendance: {
    [date: string]: {
      status: "present" | "absent" | "late" | "excused";
      remarks: string;
      id: number;
    } | null;
  };
  summary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number;
  };
}
