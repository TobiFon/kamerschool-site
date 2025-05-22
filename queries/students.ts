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
  StudentAttendanceResponse, // Import the new type
} from "@/types/students";
import { getBackendErrorMessage } from "@/lib/utils";
import { PaginatedResponse, StudentFeesTabDataResponse } from "@/types/fees";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// buildUrl function (keep as is)
export const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string => {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Ensure value is not undefined or null before appending
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

// --- Student Queries ---

// fetchStudents (keep as is)
export async function fetchStudents(
  params: FetchStudentsParams = {}
): Promise<PaginatedResponse<Student>> {
  // ... existing implementation ...
  const queryParams: Record<
    string,
    string | number | boolean | undefined | null
  > = {
    // Allow null
    page: params.page,
    page_size: params.page_size,
    search: params.search || undefined, // Use unified 'search' on backend
    // Remove redundant name/matricule mapping if backend handles 'search'
    // matricule__icontains: params.matricule ?? (params.search && params.search.includes('-') ? params.search : undefined),
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

  // Remove undefined/null params
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

// fetchStudentById (keep as is - needed for Edit Modal potentially)
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

// --- MODIFIED: Fetch Student Overview Data ---
export async function fetchStudentOverview(
  studentId: string,
  // Add academicYearId as an optional parameter
  academicYearId?: string | null
): Promise<StudentOverview> {
  // Base URL for the overview endpoint
  let url = `/students/${studentId}/overview/`;

  // Append academic_year_id as a query parameter if provided and not null/empty
  if (academicYearId) {
    url += `?academic_year_id=${academicYearId}`;
  }
  // If academicYearId is null/undefined, the backend will use its default (latest enrollment)

  const finalUrl = buildUrl(url);

  try {
    const res = await authFetch(finalUrl);

    if (!res.ok) {
      const errorData = await res.text(); // Read error response body
      console.error(
        `Failed to fetch student overview (student ${studentId}, year ${academicYearId}): ${res.status}`,
        errorData
      );
      if (res.status === 404) {
        throw new Error(
          "Student overview not found for the selected period." // More specific 404
        );
      }
      // Attempt to parse backend error message
      const backendError =
        getBackendErrorMessage(errorData) || `HTTP error ${res.status}`;
      throw new Error(backendError);
    }

    const data: StudentOverview = await res.json();
    // Add the year used for fetching to the response for clarity on the frontend
    // (Backend should ideally include this, but we can add it here if needed)
    // data._meta = { fetched_for_academic_year_id: academicYearId ?? 'latest' };
    return data;
  } catch (error) {
    // Catch network errors or JSON parsing errors
    console.error("Network or parsing error fetching student overview:", error);
    // Re-throw a generic or more specific error
    if (error instanceof Error) {
      throw new Error(`Failed to fetch overview: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching overview data.");
  }
}
// --- END NEW ---

// createStudent (keep as is)
export async function createStudent(
  formData: StudentFormData
): Promise<Student> {
  // ... existing implementation ...
  const url = buildUrl("/students/");
  const body = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "profile_picture" && value instanceof File) {
        body.append(key, value);
      } else if (value instanceof Date) {
        // Format date consistently
        body.append(key, value.toISOString().split("T")[0]);
      } else if (typeof value === "boolean") {
        body.append(key, value ? "true" : "false");
      } else if (key !== "profile_picture") {
        // Avoid adding non-file profile_picture
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
// updateStudentWithParent in queries/students.ts (or similar)
export async function updateStudentWithParent(
  id: number,
  payloadData: any // This is the 'payload' object from EditStudentModal
): Promise<Student> {
  const url = buildUrl(`/students/${id}/update/`); // Ensure buildUrl is correct
  const body = new FormData();

  console.log("--- updateStudentWithParent ---");
  console.log("Received payloadData:", JSON.stringify(payloadData, null, 2)); // Log the incoming object clearly

  Object.entries(payloadData).forEach(([key, value]) => {
    if (value !== undefined) {
      // Handle null explicitly if your backend expects empty string for clearing optional fields
      // or if null should not be sent for certain fields.
      // For FormData, null values are often converted to the string "null" or omitted.
      // Sending an empty string `''` is often safer for optional text fields if `null` is problematic.

      if (key === "profile_picture" && value instanceof File) {
        body.append(key, value as File);
      } else if (value === null && key !== "profile_picture") {
        // For non-file fields, if null, send empty string
        body.append(key, "");
        console.log(`Appending to FormData (null as empty): ${key} = ""`);
      } else if (key !== "profile_picture" && value !== null) {
        // For non-file, non-null fields
        body.append(key, String(value));
        console.log(`Appending to FormData: ${key} = ${String(value)}`);
      }
      // Note: Boolean and Date handling was removed as your payload pre-formats these.
    } else {
      console.log(`Skipping undefined value for key: ${key}`);
    }
  });

  console.log("Final FormData content before sending:");
  for (let pair of body.entries()) {
    console.log(pair[0] + ": " + pair[1]);
  }
  console.log("--- End updateStudentWithParent FormData ---");

  const requestOptions: RequestInit = {
    method: "PUT",
    body: body,
  };

  const res = await authFetch(url, requestOptions);

  if (!res.ok) {
    // More robust error parsing
    let errorDetail = `Failed to update student (status ${res.status})`;
    try {
      const errorJson = await res.json();
      errorDetail =
        getBackendErrorMessage(errorJson) || JSON.stringify(errorJson);
    } catch (e) {
      // If error response is not JSON
      try {
        const errorText = await res.text();
        errorDetail = errorText.substring(0, 200); // Truncate
      } catch (e2) {
        /* ignore */
      }
    }
    console.error("Update student/parent error from backend:", errorDetail);
    throw new Error(errorDetail);
  }
  return res.json();
}
// deleteStudent (keep as is)
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
    search: params.search || undefined, // Assuming backend handles unified search
    // Remove individual field mappings if 'search' is primary
    // name__contains: params.name,
    // email__contains: params.email,
    // phone_number__contains: params.phone,
  };
  // Remove undefined/null params
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

// --- Other Actions ---

// searchStudentsForLookup (keep as is)
export async function searchStudentsForLookup(
  searchTerm: string = ""
): Promise<StudentSimple[]> {
  // ... existing implementation ...
  const trimmedSearchTerm = searchTerm.trim();

  // Adjust minimum length if needed
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
  // Return type remains the same
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

  // --- MODIFIED ERROR HANDLING ---
  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch (e) {
      // Ignore parsing error if response is not JSON
    }
    const errorMessage =
      errorData?.message ||
      errorData?.detail ||
      res.statusText ||
      "An error occurred";

    // Check specifically for 404 "not found/not published" messages from *our* backend logic
    if (
      res.status === 404 &&
      (errorMessage.toLowerCase().includes("no published results") ||
        errorMessage.toLowerCase().includes("no results found") ||
        errorMessage
          .toLowerCase()
          .includes("not found for the selected period") ||
        errorMessage
          .toLowerCase()
          .includes("exist but have not been published") ||
        errorMessage
          .toLowerCase()
          .includes("does not align with student's enrollment") ||
        errorMessage.toLowerCase().includes("not enrolled during"))
    ) {
      console.log(
        `Results not available for student ${studentId}, params: ${JSON.stringify(
          params
        )} - Reason: ${errorMessage}`
      );

      return {
        student_info: errorData?.student_info ?? {
          id: studentId,
          full_name: "Student",
          matricule: null,
        }, // Attempt to get basic info if backend provides it on 404, else fallback
        period_type: errorData?.period_type ?? null, // Can backend provide this on 404?
        results: null, // Explicitly null results
        message: errorMessage, // Include the specific message
      };
    } else {
      // For other errors (500, 403 permission, unexpected 404), throw an error
      console.error(
        `Failed to fetch student detailed results (${res.status}):`,
        errorMessage,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch student results data (${res.status})`
      );
    }
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

  // Build query params based on filter state
  const queryParams: Record<string, string | number | undefined | null> = {
    time_scope: timeScope,
    // Only send ID if it's relevant to the selected scope or a higher scope
    academic_year_id: academicYearId ?? undefined,
    term_id:
      timeScope === "term" || timeScope === "sequence"
        ? termId ?? undefined
        : undefined,
    sequence_id: timeScope === "sequence" ? sequenceId ?? undefined : undefined,
    // The backend's resolve_period should handle using these IDs correctly
    // If time_scope is 'latest', the backend ignores the IDs unless specifically implemented otherwise
    period_id:
      timeScope !== "latest"
        ? sequenceId || termId || academicYearId || undefined
        : undefined, // Send the most specific ID if scope isn't latest
  };

  // Clean up undefined/null params before building URL
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined || queryParams[key] === null) &&
      delete queryParams[key]
  );

  const url = buildUrl(`/students/${studentId}/analytics/`, queryParams);

  const res = await authFetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Attempt to parse error
    console.error(
      `Failed to fetch student analytics (${res.status}):`,
      errorData
    );
    // Throw a specific error message if available from backend
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
  date_from?: string | null; // YYYY-MM-DD
  date_to?: string | null; // YYYY-MM-DD
  status?: string | null; // 'present', 'absent', etc.
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

  // Clean up undefined/null params before building URL
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

  // Add basic validation or transformation if needed before returning
  const data = await res.json();
  if (!data || !data.results || !data.summary) {
    console.warn(
      "Attendance API response structure might be unexpected:",
      data
    );
    // Potentially provide default structure or throw more specific error
  }

  return data as StudentAttendanceResponse;
}

interface FetchStudentFeesTabParams {
  studentId: string | number;
  academicYearId?: string | number | null;
  feePage?: number;
  paymentPage?: number;
  pageSize?: number; // Shared page size
}

export async function fetchStudentFeesTabData(
  params: FetchStudentFeesTabParams
): Promise<StudentFeesTabDataResponse> {
  const { studentId, academicYearId, feePage, paymentPage, pageSize } = params;

  const queryParams: Record<string, string | number | undefined | null> = {
    academic_year_id: academicYearId || undefined, // Send if provided
    fee_page: feePage,
    payment_page: paymentPage,
    page_size: pageSize,
  };

  // Clean params
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
