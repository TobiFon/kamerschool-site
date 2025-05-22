// src/queries/fees.ts
import { authFetch } from "@/lib/auth";
import {
  FeeType,
  ClassFee,
  StudentFee,
  Payment,
  FeeDashboardData,
  StudentFeeSummary,
  PaginatedResponse,
  FeeTypePayload,
  ClassFeePayload,
  AssignFeesPayload,
  MakePaymentPayload,
  WaiveFeePayload,
  UpdateStudentFeePayload,
} from "@/types/fees";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

// Helper to build query params
const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string => {
  const url = new URL(`${API_URL}${path}`); // Ensure '/api' prefix if needed
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Skip undefined, null, or empty strings for cleaner URLs
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
};

// Helper for handling API errors
async function handleApiError(
  response: Response,
  defaultMessage: string
): Promise<never> {
  let errorData;
  try {
    errorData = await response.json();
  } catch (e) {
    errorData = { detail: defaultMessage };
  }
  // Try to extract a meaningful message from DRF's error structure
  const message =
    errorData.detail || // Standard detail message
    (typeof errorData === "object" && errorData !== null
      ? Object.values(errorData).flat().join(" ")
      : defaultMessage) || // Flattened field errors
    defaultMessage;
  throw new Error(message);
}

// --- Fee Type Functions ---

export async function fetchFeeTypes(params?: {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
  // school_id?: number; // For superuser filtering
}): Promise<PaginatedResponse<FeeType>> {
  // Ensure PaginatedResponse if backend paginates
  // Backend handles school scoping for non-superusers
  const url = buildUrl("/fees/fee-types/", params);
  const res = await authFetch(url);
  if (!res.ok) return handleApiError(res, "Failed to fetch fee types");
  return res.json();
}

export async function createFeeType(data: FeeTypePayload): Promise<FeeType> {
  // Backend sets school based on user
  const url = buildUrl("/fees/fee-types/");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to create fee type");
  return res.json();
}

export async function updateFeeType(
  id: number,
  data: Partial<FeeTypePayload>
): Promise<FeeType> {
  // Backend ensures user owns the fee type being updated
  const url = buildUrl(`/fees/fee-types/${id}/`);
  const res = await authFetch(url, {
    method: "PATCH", // Use PATCH for partial updates
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to update fee type");
  return res.json();
}

export async function deleteFeeType(id: number): Promise<void> {
  // Backend ensures user owns the fee type
  const url = buildUrl(`/fees/fee-types/${id}/`);
  const res = await authFetch(url, { method: "DELETE" });
  // Handle 204 No Content for successful deletion
  if (!res.ok && res.status !== 204) {
    // If 409 Conflict (or other) due to protected relation
    if (res.status === 409 || res.status === 400) {
      // Or 400 for validation like PROTECT
      return handleApiError(
        res,
        "Failed to delete fee type. It might be in use."
      );
    }
    return handleApiError(res, "Failed to delete fee type.");
  }
  // No return needed for void
}

// --- Class Fee Functions ---

export async function fetchClassFees(params?: {
  search?: string;
  academic_year?: number;
  class_instance?: number;
  fee_type?: number;
  installment_allowed?: boolean;
  page?: number;
  page_size?: number; // Add page_size
  // school_id?: number; // For superuser filtering
}): Promise<PaginatedResponse<ClassFee>> {
  // Backend handles school scoping
  const url = buildUrl("/fees/class-fees/", params);
  const res = await authFetch(url);
  if (!res.ok) return handleApiError(res, "Failed to fetch class fees");
  return res.json();
}

export async function fetchClassFeesByClass(params: {
  class_id: number;
  academic_year_id?: number;
  // school_id?: number; // For superuser filtering
}): Promise<ClassFee[]> {
  // Backend handles school scoping
  const url = buildUrl("/fees/class-fees/by-class/", params);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch class fees by class");
  // Expecting a direct array from this action
  return res.json();
}

export async function createClassFee(data: ClassFeePayload): Promise<ClassFee> {
  // Backend validates ownership of related objects (class, fee type)
  const url = buildUrl("/fees/class-fees/");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to create class fee");
  return res.json();
}

export async function updateClassFee(
  id: number,
  data: Partial<ClassFeePayload>
): Promise<ClassFee> {
  // Backend validates ownership
  const url = buildUrl(`/fees/class-fees/${id}/`);
  const res = await authFetch(url, {
    method: "PATCH", // Use PATCH for partial updates
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to update class fee");
  return res.json();
}

export async function deleteClassFee(id: number): Promise<void> {
  // Backend validates ownership
  const url = buildUrl(`/fees/class-fees/${id}/`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    if (res.status === 409 || res.status === 400) {
      // Or 400 for PROTECT
      return handleApiError(
        res,
        "Failed to delete class fee. Students may have this fee assigned."
      );
    }
    return handleApiError(res, "Failed to delete class fee definition.");
  }
}

export async function assignFeesToStudents(
  classFeeId: number,
  studentIds: number[],
  customAmount?: number | null // Use null to represent unset/default
): Promise<StudentFee[]> {
  // Backend validates ownership of classFeeId and students
  const url = buildUrl(`/fees/class-fees/${classFeeId}/assign-students/`);
  const payload: AssignFeesPayload = { student_ids: studentIds };
  // Only include custom_amount if it's a number (not null or undefined)
  if (typeof customAmount === "number") {
    payload.custom_amount = customAmount;
  } else {
    payload.custom_amount = null; // Explicitly send null if backend expects it for default
  }

  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return handleApiError(res, "Failed to assign fees");
  return res.json();
}

// --- Student Fee Functions ---

export async function fetchStudentFees(params?: {
  search?: string;
  student?: number;
  class_fee?: number;
  status?: string; // Single status
  status__in?: string; // Multiple statuses (e.g., "pending,partial,overdue")
  academic_year?: number;
  class_instance?: number;
  fee_type?: number;
  page?: number;
  page_size?: number;
  // school_id?: number;
}): Promise<PaginatedResponse<StudentFee>> {
  const url = buildUrl("/fees/student-fees/", params);
  const res = await authFetch(url);
  if (!res.ok) return handleApiError(res, "Failed to fetch student fees");
  return res.json();
}

// Fetch a single StudentFee (uses detail serializer)
export async function fetchStudentFeeById(id: number): Promise<StudentFee> {
  // Backend handles school scoping via get_object based on queryset
  const url = buildUrl(`/fees/student-fees/${id}/`);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch student fee details");
  // The response should match the StudentFee type (which includes nested details)
  return res.json();
}

// Update Student Fee (primarily notes)
export async function updateStudentFee(
  id: number,
  data: UpdateStudentFeePayload
): Promise<StudentFee> {
  // Backend handles ownership check
  const url = buildUrl(`/fees/student-fees/${id}/`);
  const res = await authFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to update student fee notes");
  return res.json();
}

// Waive Student Fee action
export async function waiveStudentFee(
  id: number,
  reason: string
): Promise<StudentFee> {
  // Backend handles ownership check
  const url = buildUrl(`/fees/student-fees/${id}/waive/`);
  const payload: WaiveFeePayload = { reason };
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return handleApiError(res, "Failed to waive fee");
  return res.json();
}

// Fetch Student Fees by Student ID
export async function fetchStudentFeesByStudent(params: {
  student_id: number;
  academic_year_id?: number;
  // school_id?: number; // For superuser filtering
}): Promise<StudentFee[]> {
  // Backend handles school scoping
  const url = buildUrl("/fees/student-fees/by-student/", params);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch student fees by student");
  return res.json();
}

// Fetch Student Fees by Class ID
export async function fetchStudentFeesByClass(params: {
  class_id: number;
  academic_year_id?: number;
  fee_type_id?: number;
  status?: string; // Comma-separated? Check backend implementation
  // school_id?: number; // For superuser filtering
}): Promise<StudentFee[]> {
  // Backend handles school scoping
  const url = buildUrl("/fees/student-fees/by-class/", params);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch student fees by class");
  return res.json();
}

// Fetch Payment History for a Specific Student Fee
export async function fetchPaymentHistoryForFee(
  studentFeeId: number
): Promise<Payment[]> {
  // Backend handles school scoping via the studentFeeId access check
  const url = buildUrl(`/fees/student-fees/${studentFeeId}/payment-history/`);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch payment history for fee");
  return res.json();
}

// --- Payment Functions ---

export async function fetchPayments(params?: {
  search?: string;
  student_fee__student?: number; // Filter by student ID via student_fee relation
  student_fee__class_fee__fee_type?: number; // Filter by fee type ID via relations
  student_fee__class_fee__academic_year?: number; // Filter by academic year ID via relations
  payment_method?: string;
  payment_date__gte?: string; // Date range filter (>=)
  payment_date__lte?: string; // Date range filter (<=)
  received_by?: number;
  page?: number;
  page_size?: number;
  // school_id?: number;
}): Promise<PaginatedResponse<Payment>> {
  const url = buildUrl("/fees/payments/", params);
  const res = await authFetch(url);
  if (!res.ok) return handleApiError(res, "Failed to fetch payments");
  return res.json();
}

export async function makePayment(data: MakePaymentPayload): Promise<Payment> {
  const url = buildUrl(`/fees/payments/make-payment/`);
  // The MakePaymentPayload structure should match what PaymentCreateSerializer expects
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return handleApiError(res, "Failed to record payment");
  return res.json();
}

// Delete Payment function
export async function deletePayment(id: number): Promise<void> {
  const url = buildUrl(`/fees/payments/${id}/`);
  const res = await authFetch(url, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    return handleApiError(res, "Failed to delete payment");
  }
  // No return needed for void
}

// Fetch Payments by Student ID (uses the main fetchPayments with filtering)
export async function fetchPaymentsByStudent(
  studentId: number,
  page?: number,
  pageSize?: number
): Promise<PaginatedResponse<Payment>> {
  // Backend handles school scoping
  const response = await fetchPayments({
    student_fee__student: studentId, // Correct filter key
    page: page,
    page_size: pageSize,
  });
  return response;
}

// Fetch Recent Payments action
export async function fetchRecentPayments(
  days: number = 7
  // Add school_id if needed for superuser
): Promise<Payment[]> {
  // Backend handles school scoping
  const url = buildUrl("/fees/payments/recent/", { days });
  const res = await authFetch(url);
  if (!res.ok) return handleApiError(res, "Failed to fetch recent payments");
  return res.json();
}

// --- Dashboard & Summary Functions ---

export async function fetchFeeDashboard(params?: {
  academic_year_id?: number;
  school_id?: number; // Required for superusers
  days?: number; // For recent payments filter within dashboard
  months?: number; // For payment trends filter within dashboard
}): Promise<FeeDashboardData> {
  // Backend handles school scoping based on user or school_id param
  const url = buildUrl("/fees/dashboard/", params);
  const res = await authFetch(url);
  // Don't use handleApiError directly here, as the backend might return a 200 OK with an 'error' field inside the JSON
  if (!res.ok) {
    // Handle network or severe errors
    const errorData = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch fee dashboard data" }));
    throw new Error(errorData.detail || "Failed to fetch fee dashboard data");
  }
  const data: FeeDashboardData = await res.json();
  // The component should check data.overall_stats.error
  return data;
}

export async function fetchStudentFeeSummary(
  studentId: number,
  params?: { academic_year_id?: number } // school_id is not needed, derived from student or user
): Promise<StudentFeeSummary> {
  // Backend handles school scoping based on user/student ownership
  const url = buildUrl(`/fees/students/${studentId}/fee-summary/`, params);
  const res = await authFetch(url);
  if (!res.ok)
    return handleApiError(res, "Failed to fetch student fee summary");
  return res.json();
}
