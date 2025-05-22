// queries/teachers.ts
import { authFetch } from "@/lib/auth";
import {
  ClassSubject,
  ClassWithSubjects,
  Teacher,
  TeacherFormData,
  TeacherListResponse,
  TeacherPerformance,
} from "@/types/teachers";

/**
 * Fetches performance metrics for a specific teacher.
 * @param {number} teacherId - The ID of the teacher.
 * @returns {Promise<TeacherPerformance|null>} Teacher performance data or null if not found (404).
 * @throws {Error} If the request fails or the response is not OK (excluding 404).
 */
export async function fetchTeacherPerformance(
  teacherId: number
): Promise<TeacherPerformance | null> {
  // Updated return type
  if (!teacherId) {
    console.warn("fetchTeacherPerformance called without teacherId");
    return Promise.resolve(null);
  }
  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/teachers/${teacherId}/performance/`;

  try {
    const res = await authFetch(url);

    // --- START CHANGE ---
    if (res.status === 404) {
      console.warn(`No performance data found for teacher ID ${teacherId}`);
      return null; // Indicate no data found
    }
    // --- END CHANGE ---

    if (!res.ok) {
      // Throw error for other non-OK statuses
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to fetch performance for teacher ID ${teacherId}: ${res.statusText}`
      );
    }

    const data = await res.json();

    // Handle cases where API returns 200 OK but empty data
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.warn(
        `Empty performance data received for teacher ID ${teacherId}`
      );
      return null;
    }

    return data as TeacherPerformance; // Type assertion
  } catch (error) {
    console.error(
      `Error fetching performance for teacher ${teacherId}:`,
      error
    );
    // Re-throw other errors (already handled 404 above)
    if (!(error instanceof Error && error.message.includes("404"))) {
      throw error;
    }
    return null; // Fallback for 404 if somehow missed
  }
}

// This file should be placed in your /queries directory

/**
 * Function to fetch teachers from the API
 * @returns {Promise<TeacherListResponse>} A promise that resolves to the teachers data
 */
export async function fetchTeachers(): Promise<TeacherListResponse> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch teachers");
  }

  return res.json();
}

/**
 * Function to fetch a single teacher by ID
 * @param {number} id - The ID of the teacher to fetch
 * @returns {Promise<Teacher>} A promise that resolves to the teacher data
 */
export async function fetchTeacher(id: number): Promise<Teacher> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/${id}/`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch teacher");
  }

  return res.json();
}

/**
 * Function to create a new teacher
 * @param {TeacherFormData} data - The teacher data to create
 * @returns {Promise<Teacher>} A promise that resolves to the created teacher
 */

export async function createTeacher(formData: FormData): Promise<any> {
  try {
    const res = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/`,
      {
        method: "POST",
        // Don't set Content-Type header when using FormData - browser will set it with boundary
        headers: {
          // Include your auth headers here if needed
        },
        body: formData,
      }
    );

    const responseText = await res.text();
    if (!res.ok) {
      throw new Error(`Failed to create teacher: ${responseText}`);
    }

    return JSON.parse(responseText);
  } catch (error) {
    throw error;
  }
}

/**
 * Function to update an existing teacher
 * @param {number} id - The ID of the teacher to update
 * @param {TeacherFormData} data - The updated teacher data
 * @returns {Promise<Teacher>} A promise that resolves to the updated teacher
 */
export async function updateTeacher(id: number, data: any): Promise<Teacher> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update teacher");
  }

  return res.json();
}
/**
 * Function to delete a teacher
 * @param {number} id - The ID of the teacher to delete
 * @returns {Promise<void>} A promise that resolves when the teacher is deleted
 */
export async function deleteTeacher(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete teacher");
  }

  return;
}

export async function fetchAvailableClassSubjects(
  classId?: number
): Promise<ClassWithSubjects[]> {
  let url = `${process.env.NEXT_PUBLIC_API_URL}/subjects/classes-with-subjects/`;

  // Add class_id filter parameter if provided
  if (classId) {
    url += `?class_id=${classId}`;
  }

  const res = await authFetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch available class subjects");
  }

  return res.json();
}
export async function updateTeacherClassSubjects(
  teacherId: number,
  classSubjects: Array<{ school_class: number; subject: number }>
): Promise<{
  updated: Array<ClassSubject>;
  invalid_assignments?: Array<{
    school_class: number;
    subject: number;
    error: string;
  }>;
}> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/subjects/teachers/${teacherId}/class-subjects/bulk-update/`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(classSubjects),
  });

  if (!res.ok) {
    throw new Error("Failed to update teacher's class subjects");
  }

  return res.json();
}
