// queries/promotions.js
import { authFetch } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Updated handleResponse to better surface errors from 207/other responses
async function handleResponse(res, context = "Operation") {
  let responseData = null;
  try {
    // Attempt to parse JSON, works for 200, 201, 207, 400, 404, 500 etc.
    responseData = await res.json();
  } catch (e) {
    // Ignore parsing errors only for 204 No Content
    if (res.status !== 204) {
      console.warn(
        `Could not parse JSON response for ${context} (Status: ${res.status})`
      );
      // If parsing failed for other statuses, throw a generic error
      throw new Error(
        `${context} failed: Invalid response from server (Status: ${res.status})`
      );
    }
  }

  // --- Error Handling ---
  // Check for non-OK statuses (excluding 207 which is handled separately)
  if (!res.ok && res.status !== 207) {
    const errorMsg =
      responseData?.detail || // DRF standard validation error message
      responseData?.error || // Custom 'error' field often used
      (responseData && typeof responseData === "object"
        ? JSON.stringify(responseData)
        : null) || // Stringify other object errors
      `Request failed with status ${res.status}`; // Fallback

    console.error(
      `${context} Error (${res.status}):`,
      responseData || res.statusText
    );

    // Construct an error object, attaching the response data for more context
    const error = new Error(`${context}: ${errorMsg}`);
    error.status = res.status;
    // Attach potential field-specific errors (e.g., from DRF validation)
    error.fieldErrors =
      typeof responseData === "object" && responseData !== null
        ? responseData
        : null;
    throw error;
  }

  // --- Specific Status Handling ---
  // Handle 207 Multi-Status (Partial Success/Failure for Bulk Ops)
  if (res.status === 207 && responseData) {
    console.warn(`${context} completed with partial results:`, responseData);
    // Return the detailed response data for the caller to process
    // Expected structure: { success: [], failed: [], already_enrolled: [], not_found_or_ineligible: [] }
    return responseData;
  }

  // Handle 204 No Content (Successful Deletion/Action with no body)
  if (res.status === 204) {
    return null; // Indicate success with no data needed
  }

  // --- Default Success ---
  // For 200 OK, 201 Created, etc.
  return responseData;
}

// --- Promotion Rule Functions (Keep as is) ---
export async function managePromotionRules(ruleData = null) {
  const url = `${API_URL}/promotions/rules/`;
  const options = {
    headers: { "Content-Type": "application/json" },
    method: ruleData ? "POST" : "GET",
    body: ruleData ? JSON.stringify(ruleData) : null,
  };
  const context = ruleData ? "Create Rule" : "Fetch Rules";
  const res = await authFetch(url, options);
  return handleResponse(res, context);
}
export async function updatePromotionRule(ruleId, ruleData) {
  const url = `${API_URL}/promotions/rules/${ruleId}/`;
  const options = {
    headers: { "Content-Type": "application/json" },
    method: "PUT", // Or PATCH if backend supports it
    body: JSON.stringify(ruleData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Update Rule");
}
export async function deletePromotionRule(ruleId) {
  const url = `${API_URL}/promotions/rules/${ruleId}/`;
  const options = { method: "DELETE" };
  const res = await authFetch(url, options);
  // Handle 204 No Content specifically for delete
  if (res.status === 204) return null;
  return handleResponse(res, "Delete Rule");
}

// --- Promotion Decision Functions (Keep as is) ---
export async function createPromotionDecisions(academicYearId, classId) {
  if (!academicYearId || !classId) {
    throw new Error("Academic Year ID and Class ID are required.");
  }
  const url = `${API_URL}/promotions/decisions/`;
  const payload = {
    academic_year_id: academicYearId,
    class_id: classId,
  };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Create Automatic Decisions");
}
export async function manualPromotionDecision(
  academicYearId,
  classId,
  decisions
) {
  if (
    !academicYearId ||
    !classId ||
    !Array.isArray(decisions) ||
    decisions.length === 0
  ) {
    throw new Error(
      "Academic year ID, Class ID, and a non-empty decisions array are required."
    );
  }
  const transformedDecisions = decisions.map((d) => ({
    student_id: d.student_id, // Ensure frontend passes student_id
    status: d.status || d.promotion_status, // Allow 'status' or 'promotion_status'
    remarks: d.remarks || "",
  }));
  const url = `${API_URL}/promotions/manual-promotion-decisions/`;
  const payload = {
    academic_year_id: academicYearId,
    class_id: classId, // Backend expects class_id for context
    decisions: transformedDecisions,
  };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const res = await authFetch(url, options);
  console.log("submitted and updated decisons succesfully");
  console.log(res);
  return handleResponse(res, "Submit Manual Decisions");
}
export async function fetchClassStudentsPromotionData(classId, academicYearId) {
  if (!classId || !academicYearId) {
    console.warn(
      "fetchClassStudentsPromotionData: Missing classId or academicYearId"
    );
    return []; // Return empty array if params missing
  }
  const url = `${API_URL}/promotions/${classId}/promotion-data/?academic_year_id=${academicYearId}`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch Student Promotion Data");
  // Ensure data is an array
  return Array.isArray(data) ? data : [];
}

// --- Enrollment Workflow Functions (Updated) ---
export async function initializeEnrollmentWorkflows(
  fromAcademicYearId,
  toAcademicYearId
) {
  if (!fromAcademicYearId || !toAcademicYearId) {
    throw new Error("Both 'from' and 'to' academic year IDs are required.");
  }
  const url = `${API_URL}/promotions/enrollment-workflows/`;
  const payload = {
    from_academic_year_id: fromAcademicYearId,
    to_academic_year_id: toAcademicYearId,
  };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Initialize Workflows");
}

/**
 * Fetch enrollment workflows with filters. Requires previous_class_id and to_academic_year.
 */
export async function getEnrollmentWorkflows(params) {
  const {
    fromYearId,
    toYearId, // REQUIRED for filtering/exclusion logic
    previousClassId, // REQUIRED as primary filter
    stage,
    promotionStatus,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  // --- Validation ---
  if (
    !fromYearId ||
    !toYearId ||
    !previousClassId ||
    previousClassId === "all"
  ) {
    console.warn(
      "getEnrollmentWorkflows: Missing required IDs: fromYearId, toYearId, and previousClassId."
    );
    // Return structure matching successful response but empty
    return { count: 0, results: [], totalPages: 0, next: null, previous: null };
  }

  // --- Build Query ---
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    from_academic_year: fromYearId.toString(),
    to_academic_year: toYearId.toString(), // Pass to backend for filtering
    previous_class_id: previousClassId.toString(), // Pass mandatory filter
  });

  if (stage && stage !== "all") query.set("current_stage", stage);
  if (search) query.set("search", search); // Use 'search' field name
  if (promotionStatus && promotionStatus !== "all")
    query.set("promotion_status", promotionStatus);

  // --- API Call ---
  const url = `${API_URL}/promotions/enrollment-workflows/?${query.toString()}`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch Workflows"); // handleResponse handles errors

  // --- Format Response ---
  // Ensure consistent pagination structure even if API response varies slightly
  const totalCount = data?.count || 0;
  const calculatedTotalPages = Math.ceil(totalCount / pageSize) || 1; // Ensure at least 1 page if count is 0

  return {
    count: totalCount,
    results: data?.results || [],
    // Use calculated pages as primary, fallback to API's total_pages if available
    totalPages: data?.total_pages ?? calculatedTotalPages,
    next: data?.next || null,
    previous: data?.previous || null,
  };
}

/**
 * Update an Enrollment Workflow. Only 'select_class' is now supported.
 */
export async function updateEnrollmentWorkflow(workflowId, updateData) {
  if (!workflowId || !updateData || updateData.update_type !== "select_class") {
    // Adjusted error message
    throw new Error(
      "Workflow ID and update data with type 'select_class' are required."
    );
  }
  if (!updateData.class_id) {
    throw new Error("Class ID is required when update_type is 'select_class'.");
  }

  const url = `${API_URL}/promotions/enrollment-workflows/${workflowId}/`;
  const options = {
    method: "PATCH", // Use PATCH as we're only updating specific fields
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData), // Send { update_type: 'select_class', class_id: ..., notes: ... }
  };
  const res = await authFetch(url, options);
  // Pass more specific context to handleResponse
  return handleResponse(res, `Assign Class to Workflow`);
}

/**
 * Fetch IDs of all assignable workflows matching filters.
 * Requires previous_class_id and to_academic_year.
 */
export async function fetchAllFilteredWorkflowIds(filters) {
  const {
    fromYearId,
    toYearId, // REQUIRED
    previousClassId, // REQUIRED
    promotionStatus,
    search,
  } = filters;

  // --- Validation ---
  if (
    !fromYearId ||
    !toYearId ||
    !previousClassId ||
    previousClassId === "all"
  ) {
    throw new Error(
      "From Year, To Year, and Previous Class ID are required to fetch all IDs."
    );
  }

  // --- Build Query ---
  const query = new URLSearchParams();
  query.set("from_academic_year", fromYearId.toString());
  query.set("to_academic_year", toYearId.toString()); // Pass to backend
  query.set("previous_class_id", previousClassId.toString()); // Pass mandatory filter

  if (promotionStatus && promotionStatus !== "all")
    query.set("promotion_status", promotionStatus);
  if (search) query.set("search", search);

  // --- API Call ---
  const url = `${API_URL}/promotions/bulk-class-assignment/fetch-all-ids/?${query.toString()}`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch All Workflow IDs"); // handleResponse handles errors

  // --- Return IDs ---
  return data?.workflow_ids || []; // Return empty array if 'workflow_ids' is missing
}

/**
 * Perform bulk class assignments. Returns detailed results.
 */
export async function performBulkClassAssignments(
  workflowIds,
  classId,
  notes = ""
) {
  if (!Array.isArray(workflowIds) || workflowIds.length === 0 || !classId) {
    throw new Error(
      "Workflow IDs array and destination Class ID are required."
    );
  }

  const url = `${API_URL}/promotions/bulk-class-assignment/assign/`;
  const payload = {
    workflow_ids: workflowIds,
    class_id: classId,
    notes: notes,
  };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const res = await authFetch(url, options);
  // handleResponse will return the detailed result object on 200 or 207, or throw on other errors
  return handleResponse(res, "Bulk Assign Students");
}

// --- Direct Enrollment / Other Functions ---
export async function enrollNewStudent(classId, studentAndParentData) {
  if (
    !classId ||
    !studentAndParentData ||
    !studentAndParentData.student ||
    !studentAndParentData.parent
  ) {
    throw new Error(
      "Class ID and valid student/parent data objects are required."
    );
  }
  const url = `${API_URL}/promotions/class-enrollments/${classId}/enroll-new-student/`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentAndParentData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Enroll New Student");
}

/**
 * Edit details of an existing student enrollment record.
 * updateData format: { assigned_class_id?: number | null, status?: string, notes?: string }
 */
export async function editStudentEnrollment(enrollmentId, updateData) {
  if (!enrollmentId || !updateData || Object.keys(updateData).length === 0) {
    throw new Error("Enrollment ID and data to update are required.");
  }

  // Prepare payload for PATCH - only send fields that are provided
  const payload = {};
  if (updateData.hasOwnProperty("assigned_class_id")) {
    payload.assigned_class_id = updateData.assigned_class_id; // Send null if intended
  }
  if (updateData.hasOwnProperty("status")) {
    payload.status = updateData.status;
  }
  if (updateData.hasOwnProperty("notes")) {
    // Allow sending empty string for notes
    payload.notes = updateData.notes;
  }

  if (Object.keys(payload).length === 0) {
    console.warn("editStudentEnrollment called with no fields to update.");
    return null; // Or return the existing data? For now, return null.
  }

  const url = `${API_URL}/promotions/enrollments/${enrollmentId}/edit/`;
  const options = {
    method: "PATCH", // Use PATCH for partial updates
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Edit Enrollment");
}

/**
 * Fetch Academic Year Enrollments. Requires assigned_class_id.
 */
export async function getAcademicYearEnrollments(params = {}) {
  const {
    academicYearId,
    assignedClassId, // REQUIRED filter
    status,
    search,
    page = 1,
    pageSize = 20,
  } = params;

  // --- Validation ---
  // Frontend requires academicYearId AND assignedClassId for this view's query
  if (!academicYearId || !assignedClassId || assignedClassId === "all") {
    console.warn(
      "getAcademicYearEnrollments: Academic Year ID and Assigned Class ID are required."
    );
    return { count: 0, results: [], totalPages: 0, next: null, previous: null };
  }

  // --- Build Query ---
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    academic_year: academicYearId.toString(),
    assigned_class_id: assignedClassId.toString(), // Pass the mandatory class filter
  });

  if (status && status !== "all") query.set("status", status);
  if (search) query.set("search", search);

  // --- API Call ---
  const url = `${API_URL}/promotions/enrollments/?${query.toString()}`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch Enrollments");

  // --- Format Response ---
  const totalCount = data?.count || 0;
  const calculatedTotalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    count: totalCount,
    results: data?.results || [],
    totalPages: data?.total_pages ?? calculatedTotalPages,
    next: data?.next || null,
    previous: data?.previous || null,
  };
}

/**
 * Fetch enrollment statistics. Optionally filter by academic year.
 */
export async function getEnrollmentStatistics(academicYearId = null) {
  let url = `${API_URL}/promotions/enrollments/statistics/`;
  if (academicYearId) {
    url += `?academic_year_id=${academicYearId}`;
  }
  const res = await authFetch(url);
  // handleResponse will deal with 404 if year not found/no active year
  return handleResponse(res, "Fetch Statistics");
}
