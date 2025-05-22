// src/queries/discipline.ts

import { authFetch } from "@/lib/auth";
// Assuming buildUrl correctly handles query parameter construction
import { getBackendErrorMessage } from "@/lib/utils";
import {
  DisciplineRecord,
  DisciplineRecordFormData,
  DisciplineRecordType,
  DisciplineTypeFormData,
  FetchRecordTypesParams, // Import the new param type
  PaginatedDisciplineResponse,
} from "@/types/discipline";
import { buildUrl } from "./students";

// Base path for the discipline API
const API_BASE_PATH = "/discipline";

// --- PARAMS for General Record Fetch ---
// Interface defining the possible filter parameters for fetching multiple records
interface FetchDisciplineRecordsParams {
  page?: number;
  pageSize?: number;
  student_name?: string | null; // Search by student name/matricule
  date_from?: string | null; // YYYY-MM-DD
  date_to?: string | null; // YYYY-MM-DD
  record_category?: string | null; // e.g., 'incident', 'merit'
  severity?: string | null; // e.g., 'low', 'high'
  record_type_id?: string | number | null; // Filter by specific type ID
  class_id?: string | number | null; // Filter by student's *current* class ID
  academic_year_id?: string | number | null; // Filter by academic year record occurred in
  ordering?: string | null; // e.g., '-date_occurred,student__last_name'
  // Optional: Add school_id if superuser needs to filter across schools
  school_id?: string | number | null; // For superuser scope
}

// --- Fetch ALL Records (Paginated - for Management Page) ---
/**
 * Fetches a paginated list of discipline records based on filter criteria.
 * Typically used for the main discipline management page.
 * @param params - Filtering and pagination parameters.
 * @returns A promise resolving to the paginated discipline response.
 */
export async function fetchDisciplineRecords(
  params: FetchDisciplineRecordsParams
): Promise<PaginatedDisciplineResponse> {
  const path = `${API_BASE_PATH}/records/`;

  // Prepare query parameters, ensuring undefined/null/empty strings are excluded
  const queryParams: Record<string, string | number | undefined | null> = {
    page: params.page,
    page_size: params.pageSize,
    student_name: params.student_name || undefined,
    date_from: params.date_from || undefined,
    date_to: params.date_to || undefined,
    record_category: params.record_category || undefined,
    severity: params.severity || undefined,
    record_type_id: params.record_type_id || undefined,
    class_id: params.class_id || undefined,
    academic_year_id: params.academic_year_id || undefined,
    ordering: params.ordering || undefined,
    school_id: params.school_id || undefined, // Include school_id for potential superuser filtering
  };

  // Clean params: Remove keys with undefined, null, or empty string values
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);

  try {
    const res = await authFetch(url); // Assumes authFetch handles auth headers

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); // Try to parse error json
      console.error(
        `Failed to fetch discipline records (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) || // Use helper to extract message
          `Failed to fetch discipline records. Status: ${res.status}`
      );
    }

    // Return the parsed JSON response, casting to the expected type
    return res.json() as Promise<PaginatedDisciplineResponse>;
  } catch (error) {
    console.error(
      "Network or parsing error fetching discipline records:",
      error
    );
    // Re-throw the error for React Query or calling code to handle
    throw error;
  }
}

// --- PARAMS for Fetching Records for ONE Student ---
interface FetchStudentDisciplineParams {
  studentId: string | number; // The ID of the student
  page?: number;
  pageSize?: number;
  // Filters applicable to the 'by_student' endpoint
  date_from?: string | null; // YYYY-MM-DD
  date_to?: string | null; // YYYY-MM-DD
  record_category?: string | null; // 'incident', 'merit', etc.
  severity?: string | null; // 'low', 'medium', etc.
  ordering?: string | null; // e.g., '-date_occurred'
  // Note: class_id, academic_year_id etc. *could* be passed if the backend
  // filterset used in `by_student` supports them, but they might be less common here.
}

// --- Fetch Records for ONE Student (Paginated - for Student Detail Tab) ---
/**
 * Fetches a paginated list of discipline records for a specific student.
 * Uses the dedicated 'by-student' backend action.
 * @param params - Student ID and optional filtering/pagination parameters.
 * @returns A promise resolving to the paginated discipline response for the student.
 */
export async function fetchStudentDisciplineRecords(
  params: FetchStudentDisciplineParams
): Promise<PaginatedDisciplineResponse> {
  const {
    studentId,
    page,
    pageSize,
    date_from,
    date_to,
    record_category,
    severity,
    ordering,
  } = params;

  // Construct the specific URL for the 'by_student' action
  const path = `${API_BASE_PATH}/records/by-student/${studentId}/`;

  const queryParams: Record<string, string | number | undefined | null> = {
    page: page,
    page_size: pageSize,
    date_from: date_from || undefined,
    date_to: date_to || undefined,
    record_category: record_category || undefined,
    severity: severity || undefined,
    ordering: ordering || undefined,
  };

  // Clean params
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);

  try {
    const res = await authFetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to fetch student discipline records for student ${studentId} (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch student discipline records. Status: ${res.status}`
      );
    }

    return res.json() as Promise<PaginatedDisciplineResponse>;
  } catch (error) {
    console.error(
      `Network or parsing error fetching student discipline records for student ${studentId}:`,
      error
    );
    throw error;
  }
}

// --- Fetch a Single Record by ID ---
/**
 * Fetches a single discipline record by its ID.
 * @param recordId - The ID of the record to fetch.
 * @returns A promise resolving to the discipline record.
 */
export async function fetchDisciplineRecordById(
  recordId: number
): Promise<DisciplineRecord> {
  const path = `${API_BASE_PATH}/records/${recordId}/`;
  const url = buildUrl(path); // No query params needed

  try {
    const res = await authFetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to fetch discipline record ${recordId} (${res.status}):`,
        errorData
      );
      if (res.status === 404) {
        throw new Error("Discipline record not found.");
      }
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch discipline record ${recordId}. Status: ${res.status}`
      );
    }
    return res.json() as Promise<DisciplineRecord>;
  } catch (error) {
    console.error(
      `Network or parsing error fetching discipline record ${recordId}:`,
      error
    );
    throw error;
  }
}

// --- CREATE a New Record ---
/**
 * Creates a new discipline record.
 * @param data - The data for the new record, conforming to DisciplineRecordFormData.
 * @returns A promise resolving to the newly created discipline record.
 */
export async function createDisciplineRecord(
  data: DisciplineRecordFormData
): Promise<DisciplineRecord> {
  const path = `${API_BASE_PATH}/records/`;
  const url = buildUrl(path);

  // Ensure student and record_type are numbers before sending
  const payload = {
    ...data,
    student: Number(data.student),
    record_type: Number(data.record_type),
    // Convert empty string severity/time to null if necessary
    severity: data.severity === "" ? null : data.severity,
    time_occurred: data.time_occurred === "" ? null : data.time_occurred,
  };

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to create discipline record (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to create discipline record. Status: ${res.status}`
      );
    }
    return res.json() as Promise<DisciplineRecord>;
  } catch (error) {
    console.error(
      "Network or parsing error creating discipline record:",
      error
    );
    throw error;
  }
}

// --- UPDATE an Existing Record ---
/**
 * Updates an existing discipline record using a PATCH request.
 * @param recordId - The ID of the record to update.
 * @param data - An object containing the fields to update. Conforms to Partial<DisciplineRecordFormData>.
 * @returns A promise resolving to the updated discipline record.
 */
export async function updateDisciplineRecord(
  recordId: number,
  data: Partial<DisciplineRecordFormData> // Allow partial updates
): Promise<DisciplineRecord> {
  const path = `${API_BASE_PATH}/records/${recordId}/`;
  const url = buildUrl(path);

  // Prepare payload, ensuring IDs are numbers if provided in partial data
  const payload: Partial<DisciplineRecordFormData> = { ...data };
  if (payload.student !== undefined) payload.student = Number(payload.student);
  if (payload.record_type !== undefined)
    payload.record_type = Number(payload.record_type);
  if (payload.severity === "") payload.severity = null;
  if (payload.time_occurred === "") payload.time_occurred = null;

  try {
    const res = await authFetch(url, {
      method: "PATCH", // Use PATCH for partial updates
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to update discipline record ${recordId} (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to update discipline record ${recordId}. Status: ${res.status}`
      );
    }
    return res.json() as Promise<DisciplineRecord>;
  } catch (error) {
    console.error(
      `Network or parsing error updating discipline record ${recordId}:`,
      error
    );
    throw error;
  }
}

// --- DELETE a Record ---
/**
 * Deletes a discipline record by its ID.
 * @param recordId - The ID of the record to delete.
 * @returns A promise that resolves when deletion is successful.
 */
export async function deleteDisciplineRecord(recordId: number): Promise<void> {
  const path = `${API_BASE_PATH}/records/${recordId}/`;
  const url = buildUrl(path);

  try {
    const res = await authFetch(url, { method: "DELETE" });

    // Check for successful deletion (204 No Content) or other success codes if applicable
    if (!res.ok && res.status !== 204) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to delete discipline record ${recordId} (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to delete discipline record ${recordId}. Status: ${res.status}`
      );
    }
    // No content to return on successful delete (status 204)
  } catch (error) {
    console.error(
      `Network or other error deleting discipline record ${recordId}:`,
      error
    );
    throw error;
  }
}

// --- Fetch ACTIVE Discipline Record Types (Non-Paginated - for Dropdowns) ---
/**
 * Fetches a list of *active* discipline record types.
 * Uses the dedicated 'active-types' backend action for efficiency.
 * @param params - Optional filtering parameters (e.g., category, school_id for superuser).
 * @returns A promise resolving to an array of active discipline record types.
 */
export async function fetchDisciplineRecordTypes(
  params?: FetchRecordTypesParams // Use the defined param type
): Promise<DisciplineRecordType[]> {
  // Use the dedicated action for fetching active types efficiently
  const path = `${API_BASE_PATH}/record-types/active-types/`;

  // Prepare query params if any are provided
  const queryParams: Record<
    string,
    string | number | boolean | undefined | null
  > = {
    // The backend action might support filters via its filterset
    category: params?.category || undefined,
    school_id: params?.school_id || undefined,
    // is_active is implicit in the endpoint name, no need to send
  };

  // Clean params
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);

  try {
    const res = await authFetch(url);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to fetch active discipline record types (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch active discipline record types. Status: ${res.status}`
      );
    }
    // The active-types action returns a list directly (not paginated)
    return res.json() as Promise<DisciplineRecordType[]>;
  } catch (error) {
    console.error(
      "Network or parsing error fetching active discipline record types:",
      error
    );
    throw error;
  }
}

// --- Fetch ALL Discipline Record Types (Paginated - for Type Management Tab) ---
/**
 * Fetches a paginated list of all discipline record types based on filter criteria.
 * Typically used for the "Record Types" management tab.
 * @param params - Filtering and pagination parameters.
 * @returns A promise resolving to the paginated record types response.
 */
export async function fetchPaginatedRecordTypes(params: {
  page?: number;
  pageSize?: number;
  category?: string | null;
  is_active?: boolean | null; // Use boolean for this filter
  search?: string | null; // Add search if backend supports it on name/desc
  ordering?: string | null;
  school_id?: string | number | null; // For superuser scope
}): Promise<PaginatedRecordTypesResponse> {
  const path = `${API_BASE_PATH}/record-types/`; // Use the main endpoint, not /active-types/

  const queryParams: Record<
    string,
    string | number | boolean | undefined | null
  > = {
    page: params.page,
    page_size: params.pageSize,
    category: params.category || undefined,
    // Convert boolean to string for query param if necessary, or handle bool directly if backend filter supports it
    is_active:
      typeof params.is_active === "boolean" ? params.is_active : undefined,
    search: params.search || undefined,
    ordering: params.ordering || undefined,
    school_id: params.school_id || undefined,
  };

  // Clean params
  Object.keys(queryParams).forEach(
    (key) =>
      (queryParams[key] === undefined ||
        queryParams[key] === null ||
        queryParams[key] === "") &&
      delete queryParams[key]
  );

  const url = buildUrl(path, queryParams);

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to fetch paginated record types (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to fetch record types. Status: ${res.status}`
      );
    }
    return res.json() as Promise<PaginatedRecordTypesResponse>;
  } catch (error) {
    console.error(
      "Network or parsing error fetching paginated record types:",
      error
    );
    throw error;
  }
}

// --- CREATE a New Record Type ---
/**
 * Creates a new discipline record type.
 * @param data - The data for the new record type.
 * @returns A promise resolving to the newly created record type.
 */
export async function createRecordType(
  data: DisciplineTypeFormData
): Promise<DisciplineRecordType> {
  const path = `${API_BASE_PATH}/record-types/`;
  const url = buildUrl(path);

  // Add school_id if required by backend (e.g., for superuser)
  // Usually backend serializer handles school based on user or provided ID
  const payload = { ...data };
  // Clean payload if necessary (e.g., ensure severity is valid enum or null)
  if (payload.default_severity === "") payload.default_severity = null;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(`Failed to create record type (${res.status}):`, errorData);
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to create record type. Status: ${res.status}`
      );
    }
    return res.json() as Promise<DisciplineRecordType>;
  } catch (error) {
    console.error("Network or parsing error creating record type:", error);
    throw error;
  }
}

// --- UPDATE an Existing Record Type ---
/**
 * Updates an existing discipline record type using PATCH.
 * @param typeId - The ID of the record type to update.
 * @param data - An object containing the fields to update.
 * @returns A promise resolving to the updated record type.
 */
export async function updateRecordType(
  typeId: number,
  data: Partial<DisciplineTypeFormData>
): Promise<DisciplineRecordType> {
  const path = `${API_BASE_PATH}/record-types/${typeId}/`;
  const url = buildUrl(path);

  const payload = { ...data };
  // Clean payload if necessary
  if (payload.default_severity === "") payload.default_severity = null;
  // Remove school field if present, as it shouldn't be changed here typically
  delete payload.school;

  try {
    const res = await authFetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to update record type ${typeId} (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to update record type ${typeId}. Status: ${res.status}`
      );
    }
    return res.json() as Promise<DisciplineRecordType>;
  } catch (error) {
    console.error(
      `Network or parsing error updating record type ${typeId}:`,
      error
    );
    throw error;
  }
}

// --- DELETE a Record Type ---
/**
 * Deletes a discipline record type by its ID.
 * @param typeId - The ID of the record type to delete.
 * @returns A promise that resolves when deletion is successful.
 */
export async function deleteRecordType(typeId: number): Promise<void> {
  const path = `${API_BASE_PATH}/record-types/${typeId}/`;
  const url = buildUrl(path);

  try {
    const res = await authFetch(url, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const errorData = await res.json().catch(() => ({}));
      console.error(
        `Failed to delete record type ${typeId} (${res.status}):`,
        errorData
      );
      throw new Error(
        getBackendErrorMessage(errorData) ||
          `Failed to delete record type ${typeId}. Status: ${res.status}`
      );
    }
  } catch (error) {
    console.error(
      `Network or other error deleting record type ${typeId}:`,
      error
    );
    throw error;
  }
}
