import { authFetch } from "@/lib/auth";
import {
  Student,
  StudentFormData,
  Parent,
  FetchStudentsParams,
  FetchParentsParams,
  StudentSimple,
  StudentOverview,
  StudentDetailedResultsResponse,
  StudentPerformanceAnalyticsResponse,
  StudentAttendanceResponse,
} from "@/types/students";
import { getBackendErrorMessage } from "@/lib/utils";
import { PaginatedResponse, StudentFeesTabDataResponse } from "@/types/fees";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string => {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

// --- Student Queries ---

export async function fetchStudents(
  params: FetchStudentsParams = {}
): Promise<PaginatedResponse<Student>> {
  const queryParams: Record<
    string,
    string | number | boolean | undefined | null
  > = {
    page: params.page,
    page_size: params.page_size,
    search: params.search || undefined,
    status: params.status,
    sex: params.sex,
    age_min: params.minAge,
    age_max: params.maxAge,
    enrollment_class: params.enrollment_class,
    enrollment_year: params.enrollment_year,
    enrollment_status: params.enrollment_status,
    enrolled_after: params.enrollmentAfter,
    enrolled_before: params.enrollmentBefore,
    parent__name__icontains: params.parentName,
  };

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl("/students/", queryParams);
  const res = await authFetch(url);
  if (!res.ok) {
    console.error("Failed to fetch students:", res.status, await res.text());
    throw new Error("Failed to fetch students list");
  }
  return res.json();
}

export async function fetchStudentById(studentId: string): Promise<Student> {
  const url = buildUrl(`/students/${studentId}/`);
  const res = await authFetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Student not found");
    console.error("Failed to fetch student:", res.status, await res.text());
    throw new Error("Failed to fetch student details");
  }
  return res.json();
}

export async function fetchStudentOverview(
  studentId: string,
  academicYearId?: string | null
): Promise<StudentOverview> {
  let url = `/students/${studentId}/overview/`;
  if (academicYearId) {
    url += `?academic_year_id=${academicYearId}`;
  }
  const finalUrl = buildUrl(url);

  try {
    const res = await authFetch(finalUrl);
    if (!res.ok) {
      const errorData = await res.text();
      console.error(
        `Failed to fetch student overview (student ${studentId}, year ${academicYearId}): ${res.status}`,
        errorData
      );
      if (res.status === 404) {
        throw new Error("Student overview not found for the selected period.");
      }
      const backendError =
        getBackendErrorMessage(errorData) || `HTTP error ${res.status}`;
      throw new Error(backendError);
    }
    const data: StudentOverview = await res.json();
    return data;
  } catch (error) {
    console.error("Network or parsing error fetching student overview:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch overview: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching overview data.");
  }
}

export async function createStudent(
  formData: StudentFormData
): Promise<Student> {
  const url = buildUrl("/students/");
  const body = new FormData();
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "profile_picture" && value instanceof File) {
        body.append(key, value);
      } else if (value instanceof Date) {
        body.append(key, value.toISOString().split("T")[0]);
      } else if (typeof value === "boolean") {
        body.append(key, value ? "true" : "false");
      } else if (key !== "profile_picture") {
        body.append(key, String(value));
      }
    }
  });

  const res = await authFetch(url, {
    method: "POST",
    body: body,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Create student error:", errorData);
    throw new Error(
      getBackendErrorMessage(errorData) || "Failed to create student"
    );
  }
  return res.json();
}

export async function updateStudentWithParent(
  id: number,
  payloadData: any
): Promise<Student> {
  const url = buildUrl(`/students/${id}/update/`);
  const body = new FormData();
  Object.entries(payloadData).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === "profile_picture" && value instanceof File) {
        body.append(key, value as File);
      } else if (value === null && key !== "profile_picture") {
        body.append(key, "");
      } else if (key !== "profile_picture" && value !== null) {
        body.append(key, String(value));
      }
    }
  });

  const requestOptions: RequestInit = {
    method: "PUT",
    body: body,
  };
  const res = await authFetch(url, requestOptions);

  if (!res.ok) {
    let errorDetail = `Failed to update student (status ${res.status})`;
    try {
      const errorJson = await res.json();
      errorDetail =
        getBackendErrorMessage(errorJson) || JSON.stringify(errorJson);
    } catch (e) {
      try {
        const errorText = await res.text();
        errorDetail = errorText.substring(0, 200);
      } catch (e2) {
        /* ignore */
      }
    }
    console.error("Update student/parent error from backend:", errorDetail);
    throw new Error(errorDetail);
  }
  return res.json();
}

export async function deleteStudent(studentId: string): Promise<void> {
  const url = buildUrl(`/students/${studentId}/`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Delete student error:", errorData);
    throw new Error(
      getBackendErrorMessage(errorData) || "Failed to delete student"
    );
  }
}

export async function fetchParents(
  params: FetchParentsParams = {}
): Promise<PaginatedResponse<Parent>> {
  const queryParams: Record<string, string | number | undefined | null> = {
    page: params.page,
    page_size: params.page_size,
    search: params.search || undefined,
  };
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );
  const url = buildUrl("/students/parents/", queryParams);
  const res = await authFetch(url);
  if (!res.ok) {
    console.error("Failed to fetch parents:", res.status, await res.text());
    throw new Error("Failed to fetch parents list");
  }
  return res.json();
}

export async function fetchParentById(id: number): Promise<Parent> {
  const url = buildUrl(`/students/parents/${id}/`);
  const res = await authFetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Parent not found");
    console.error("Failed to fetch parent:", res.status, await res.text());
    throw new Error("Failed to fetch parent details");
  }
  return res.json();
}

export async function createParent(
  data: Omit<Parent, "id" | "created_at" | "updated_at">
): Promise<Parent> {
  const url = buildUrl("/students/parents/");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Create parent error:", errorData);
    throw new Error(
      getBackendErrorMessage(errorData) || "Failed to create parent"
    );
  }
  return res.json();
}

export async function updateParent(
  id: number,
  data: Partial<Omit<Parent, "id" | "created_at" | "updated_at">>
): Promise<Parent> {
  const url = buildUrl(`/students/parents/${id}/`);
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Update parent error:", errorData);
    throw new Error(
      getBackendErrorMessage(errorData) || "Failed to update parent"
    );
  }
  return res.json();
}

export async function deleteParent(id: number): Promise<void> {
  const url = buildUrl(`/students/parents/${id}/`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Delete parent error:", errorData);
    throw new Error(
      getBackendErrorMessage(errorData) || "Failed to delete parent"
    );
  }
}

export async function searchStudentsForLookup(
  searchTerm: string = ""
): Promise<StudentSimple[]> {
  const trimmedSearchTerm = searchTerm.trim();
  if (!trimmedSearchTerm || trimmedSearchTerm.length < 2) {
    return [];
  }
  const queryParams: Record<string, string> = {
    search: trimmedSearchTerm,
  };
  const url = buildUrl("/students/lookup/", queryParams);
  try {
    const res = await authFetch(url);
    if (!res.ok) {
      console.error(
        `Failed to search students (status: ${res.status}):`,
        await res.text()
      );
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Network or parsing error searching students:", error);
    return [];
  }
}

interface FetchStudentResultsParams {
  studentId: string | number;
  academicYearId?: string | number | null;
  termId?: string | number | null;
  sequenceId?: string | number | null;
}

export async function fetchStudentDetailedResults(
  params: FetchStudentResultsParams
): Promise<StudentDetailedResultsResponse> {
  const { studentId, academicYearId, termId, sequenceId } = params;

  const queryParams: Record<string, string | number | undefined | null> = {
    sequence_id: sequenceId || undefined,
    term_id: !sequenceId && termId ? termId : undefined,
    academic_year_id:
      !sequenceId && !termId && academicYearId ? academicYearId : undefined,
  };

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl(`/students/${studentId}/results/`, queryParams);
  const res = await authFetch(url);

  if (!res.ok) {
    // If we receive a 404, we interpret it as "no data found for this period"
    // and return a successful promise with a custom payload.
    // This prevents the entire UI from breaking.
    if (res.status === 404) {
      let errorData: any = {};
      try {
        errorData = await res.json();
      } catch (e) {
        // If there's no JSON body, we still proceed.
      }

      console.warn(
        `Results not found (404) for student ${studentId}. Reason:`,
        errorData.message || "No data available."
      );

      // Construct a valid response shape to signal "no results" to the UI.
      return {
        student_info: errorData?.student_info ?? {
          id: Number(studentId),
          full_name: "Student",
          matricule: null,
        },
        period_type: errorData?.period_type ?? null,
        results: null, // This is the key part: results are null
        message:
          errorData?.message || "No results found for the selected period.", // Pass the message along
      };
    }

    // For any other error (500, 403, etc.), we throw a real error to be caught by react-query.
    const errorData = await res.json().catch(() => ({}));
    console.error(
      `Failed to fetch student detailed results (${res.status}):`,
      errorData
    );
    throw new Error(
      getBackendErrorMessage(errorData) ||
        `Failed to fetch results (${res.status})`
    );
  }

  return res.json();
}

interface FetchStudentAnalyticsParams {
  studentId: string | number;
  timeScope: "latest" | "year" | "term" | "sequence";
  academicYearId?: string | number | null;
  termId?: string | number | null;
  sequenceId?: string | number | null;
}

export async function fetchStudentPerformanceAnalytics(
  params: FetchStudentAnalyticsParams
): Promise<StudentPerformanceAnalyticsResponse> {
  const { studentId, timeScope, academicYearId, termId, sequenceId } = params;
  const queryParams: Record<string, string | number | undefined | null> = {
    time_scope: timeScope,
    academic_year_id: academicYearId ?? undefined,
    term_id:
      timeScope === "term" || timeScope === "sequence"
        ? (termId ?? undefined)
        : undefined,
    sequence_id:
      timeScope === "sequence" ? (sequenceId ?? undefined) : undefined,
    period_id:
      timeScope !== "latest"
        ? sequenceId || termId || academicYearId || undefined
        : undefined,
  };

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl(`/students/${studentId}/analytics/`, queryParams);
  const res = await authFetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(
      `Failed to fetch student analytics (${res.status}):`,
      errorData
    );
    throw new Error(
      getBackendErrorMessage(errorData) ||
        `Failed to fetch student analytics (${res.status})`
    );
  }

  return res.json() as Promise<StudentPerformanceAnalyticsResponse>;
}

interface FetchStudentAttendanceParams {
  studentId: string | number;
  page?: number;
  pageSize?: number;
  date_from?: string | null;
  date_to?: string | null;
  status?: string | null;
}

export async function fetchStudentAttendance(
  params: FetchStudentAttendanceParams
): Promise<StudentAttendanceResponse> {
  const { studentId, page, pageSize, date_from, date_to, status } = params;
  const queryParams: Record<string, string | number | undefined | null> = {
    page: page,
    page_size: pageSize,
    date_from: date_from || undefined,
    date_to: date_to || undefined,
    status: status || undefined,
  };

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl(`/students/${studentId}/attendance/`, queryParams);
  const res = await authFetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(
      `Failed to fetch student attendance (${res.status}):`,
      errorData
    );
    throw new Error(
      getBackendErrorMessage(errorData) ||
        `Failed to fetch student attendance (${res.status})`
    );
  }

  const data = await res.json();
  if (!data || !data.results || !data.summary) {
    console.warn(
      "Attendance API response structure might be unexpected:",
      data
    );
  }
  return data as StudentAttendanceResponse;
}

interface FetchStudentFeesTabParams {
  studentId: string | number;
  academicYearId?: string | number | null;
  feePage?: number;
  paymentPage?: number;
  pageSize?: number;
}

export async function fetchStudentFeesTabData(
  params: FetchStudentFeesTabParams
): Promise<StudentFeesTabDataResponse> {
  const { studentId, academicYearId, feePage, paymentPage, pageSize } = params;

  const queryParams: Record<string, string | number | undefined | null> = {
    academic_year_id: academicYearId || undefined,
    fee_page: feePage,
    payment_page: paymentPage,
    page_size: pageSize,
  };

  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl(`/students/${studentId}/fees-data/`, queryParams);
  const res = await authFetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error(
      `Failed to fetch student fees tab data (${res.status}):`,
      errorData
    );
    throw new Error(
      getBackendErrorMessage(errorData) ||
        `Failed to fetch student fee data (${res.status})`
    );
  }

  return res.json() as Promise<StudentFeesTabDataResponse>;
}
