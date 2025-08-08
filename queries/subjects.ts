// queries/subjectPerformance.ts
import { authFetch } from "@/lib/auth";
import { SubjectPerformance } from "@/types/subjects";
import { Subject } from "./admin";

export async function fetchSubjectPerformance(): Promise<SubjectPerformance[]> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/school/subjects/analysis/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch subject performance data");
  }
  return res.json();
}

export async function fetchSubjects(): Promise<any> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/subjects/`);
  if (!res.ok) {
    throw new Error("Failed to fetch subjects");
  }
  return res.json();
}

export async function fetchUnpaginatedSubjects(params: {
  education_system: string;
  school_level: string;
}): Promise<Subject[]> {
  const query = new URLSearchParams(params);

  // Call the new dedicated URL
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/unpaginated/?${query.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch subjects for class");
  }

  // This endpoint returns a simple array
  return res.json();
}
export async function bulkCreateClassSubjects(
  classId: number,
  payload: any
): Promise<any> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/${classId}/class-subjects/bulk-update/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    throw new Error("Failed to bulk create class subjects");
  }
  return res.json();
}

export async function fetchClassSubjects(classId: number) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/class-subjects/?school_class=${classId}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch class subjects");
  }

  return res.json();
}

export async function fetchStudentSubjectEnrollments(
  studentId: string
): Promise<any[]> {
  // Fetches the student's *current* subject enrollments (StudentSubject records)
  // It should return enough info to identify the corresponding ClassSubject (e.g., class_subject_id)
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/student-subjects/?student=${studentId}&is_active=true`
  );
  if (!res.ok) throw new Error("Failed to fetch student subject enrollments");
  return res.json();
}

// lib/queries/subjects.ts (or appropriate file)

export async function bulkUpdateStudentSubjects(
  studentId: string,
  classSubjectIds: number[]
): Promise<any> {
  const res = await authFetch(
    // Use the NEW URL pattern matching your urls.py
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/students/${studentId}/subjects/bulk-update/`,
    {
      method: "POST", // Keep POST
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_subject_ids: classSubjectIds }),
    }
  );
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Unknown error occurred" }));
    // Try to extract specific errors if the backend sends them
    let errorMessage = errorData.detail || "Failed to update student subjects";
    if (typeof errorData === "object" && errorData !== null) {
      // Check for DRF validation error structure
      if (errorData.class_subject_ids) {
        errorMessage = `Invalid Class Subject IDs: ${errorData.class_subject_ids.join(
          ", "
        )}`;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    }
    throw new Error(errorMessage);
  }
  return res.json();
}
