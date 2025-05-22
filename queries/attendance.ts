import { authFetch } from "@/lib/auth";
import { ClassWeeklyAttendanceResponse } from "@/types/attendance";

export async function fetchClassMetrics(
  classId: string,
  params?: { from_date?: string; to_date?: string }
): Promise<any> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/attendance/classes/${classId}/summary/`
  );
  if (params?.from_date) {
    url.searchParams.append("from_date", params.from_date);
  }
  if (params?.to_date) {
    url.searchParams.append("to_date", params.to_date);
  }
  const res = await authFetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch class metrics");
  }
  return res.json();
}

/**
 * Fetches weekly attendance data for a class
 *
 * @param classId - The ID of the class
 * @param params - Optional query parameters (week_start, week_offset)
 * @returns Promise with the weekly attendance data
 */
export async function fetchClassWeeklyAttendance(
  classId: string,
  params?: any
): Promise<any> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/attendance/classes/${classId}/weekly/`
  );

  // Add query parameters if provided
  if (params?.week_start) {
    url.searchParams.append("week_start", params.week_start);
  }

  if (params?.week_offset !== undefined) {
    url.searchParams.append("week_offset", params.week_offset.toString());
  }

  const res = await authFetch(url.toString());

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Failed to fetch weekly attendance data"
    );
  }

  return res.json();
}

/**
 * Fetches attendance data for a specific day
 *
 * @param classId - The ID of the class
 * @param date - The date to fetch attendance for (format: YYYY-MM-DD)
 * @returns Promise with the daily attendance data
 */
export async function fetchDailyAttendance(
  classId: string,
  date: string
): Promise<any> {
  // Use the dedicated daily endpoint
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL}/attendance/classes/${classId}/daily/`
  );

  // Add date as a query parameter
  url.searchParams.append("date", date);

  const res = await authFetch(url.toString());

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch daily attendance data");
  }

  return res.json();
}

/**
 * Records or updates attendance for multiple students for a specific day
 *
 * @param classId - The ID of the class
 * @param date - The date for the attendance (format: YYYY-MM-DD)
 * @param students - Array of student attendance records
 * @returns Promise with the response data
 */
export async function recordClassAttendance(
  classId: string,
  date: string,
  students: Array<{
    student_id: number;
    status: "present" | "absent" | "late" | "excused";
    remarks?: string;
  }>
): Promise<any> {
  // Update to use the new daily endpoint
  const url = `${process.env.NEXT_PUBLIC_API_URL}/attendance/classes/${classId}/daily/`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date,
      students,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to record attendance");
  }

  return res.json();
}
