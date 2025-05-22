// queries/transfers.ts

import { authFetch } from "@/lib/auth";
// Assuming buildUrl helper exists and handles URL construction
import { buildUrl } from "./students"; // Make sure this helper exists

// Import interfaces - MAKE SURE THESE ARE DEFINED/IMPORTED CORRECTLY
import { StudentSimple, FullStudent } from "@/types/students"; // Example paths
import {
  TargetClass,
  TransferRequest,
  TransferRequestDetail,
} from "@/types/transfers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BASE_PATH = `${API_URL}/transfers/requests`; // Base for transfer requests

// --- Refined handleResponse (Keep existing implementation) ---
async function handleResponse(res: Response, context = "Operation") {
  let responseData: any = null;
  const contentType = res.headers.get("content-type");
  try {
    if (contentType && contentType.includes("application/json")) {
      responseData = await res.json();
    } else if (res.status !== 204) {
      console.warn(
        `Non-JSON response for ${context} (Status: ${res.status}, Type: ${contentType})`
      );
    }
  } catch (e) {
    if (res.status !== 204) {
      console.error(
        `Could not parse response for ${context} (Status: ${res.status})`,
        e
      );
      throw new Error(
        `${context} failed: Invalid response from server (Status: ${res.status})`
      );
    }
  }
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    let fieldErrors: Record<string, string[]> | null = null;
    if (responseData) {
      if (responseData.detail) {
        errorMsg = responseData.detail;
      } else if (typeof responseData === "object" && responseData !== null) {
        const fieldKeys = Object.keys(responseData);
        if (fieldKeys.length > 0 && Array.isArray(responseData[fieldKeys[0]])) {
          fieldErrors = responseData;
          const firstKey = fieldKeys[0];
          errorMsg = `${firstKey}: ${responseData[firstKey][0]}`;
        } else {
          try {
            errorMsg = JSON.stringify(responseData);
          } catch {
            errorMsg = "Could not stringify error response object.";
          }
        }
      } else if (typeof responseData === "string") {
        errorMsg = responseData;
      }
    } else {
      errorMsg = res.statusText || errorMsg;
    }
    console.error(
      `${context} Error (${res.status}):`,
      errorMsg,
      fieldErrors || ""
    );
    const error = new Error(`${context}: ${errorMsg}`);
    (error as any).status = res.status;
    (error as any).fieldErrors = fieldErrors;
    (error as any).detail = responseData?.detail;
    throw error;
  }
  if (res.status === 204) {
    return null;
  }
  return responseData;
}

// --- API Call Functions (Keep existing implementations) ---

/**
 * Fetch a list of transfer requests based on filters.
 */
export async function fetchTransferRequests(
  params: {
    status?: string;
    fromSchoolId?: number;
    toSchoolId?: number;
    effectiveYearId?: number | string;
    studentId?: number;
    studentMatricule?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<{
  // Return type uses updated TransferRequest interface
  count: number;
  results: TransferRequest[];
  totalPages: number;
  next: string | null;
  previous: string | null;
}> {
  const {
    status,
    fromSchoolId,
    toSchoolId,
    effectiveYearId,
    studentId,
    studentMatricule,
    search,
    page = 1,
    pageSize = 15,
  } = params;
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (status && status !== "all") query.set("status", status);
  if (fromSchoolId) query.set("from_school__id", fromSchoolId.toString());
  if (toSchoolId) query.set("to_school__id", toSchoolId.toString());
  if (effectiveYearId && effectiveYearId !== "")
    query.set("effective_academic_year__id", effectiveYearId.toString());
  if (studentId) query.set("student__id", studentId.toString());
  if (studentMatricule) query.set("student__matricule", studentMatricule);
  if (search) query.set("search", search);
  const url = `${BASE_PATH}/?${query.toString()}`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch Transfer Requests");
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
 * Fetch details of a single transfer request.
 */
export async function fetchTransferRequestDetail(
  requestId: number
): Promise<TransferRequestDetail | null> {
  if (!requestId) throw new Error("Request ID is required.");
  const url = `${BASE_PATH}/${requestId}/`;
  const res = await authFetch(url);
  return handleResponse(res, "Fetch Transfer Detail");
}

/**
 * Initiate a new transfer request.
 */
export async function initiateTransferRequest(initiateData: {
  student_id: number;
  to_school_id: number;
  effective_academic_year_id: number;
  reason: string;
  from_school_notes?: string;
}): Promise<TransferRequestDetail> {
  // Expects Detail back
  if (
    !initiateData ||
    !initiateData.student_id ||
    !initiateData.to_school_id ||
    !initiateData.effective_academic_year_id ||
    !initiateData.reason
  ) {
    throw new Error("Missing required fields for initiating transfer.");
  }
  const url = `${BASE_PATH}/initiate/`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(initiateData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Initiate Transfer");
}

/**
 * Review (Approve/Reject) a pending transfer request.
 */
export async function reviewTransferRequest(
  requestId: number,
  reviewData: { approve: boolean; notes?: string }
): Promise<TransferRequestDetail> {
  // Expects Detail back
  if (reviewData === null || typeof reviewData.approve !== "boolean") {
    throw new Error("Review data (approve status) is required.");
  }
  const url = `${BASE_PATH}/${requestId}/review/`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Review Transfer");
}

/**
 * Complete an approved transfer request.
 */
export async function completeTransferRequest(
  requestId: number,
  completeData: { target_class_id: number; notes?: string }
): Promise<TransferRequestDetail> {
  // Expects Detail back
  if (!completeData || !completeData.target_class_id) {
    throw new Error("Target class ID is required to complete the transfer.");
  }
  const url = `${BASE_PATH}/${requestId}/complete/`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(completeData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Complete Transfer");
}

/**
 * Cancel a pending transfer request.
 */
export async function cancelTransferRequest(
  requestId: number,
  cancelData: { reason: string }
): Promise<TransferRequestDetail> {
  // Expects Detail back
  if (!cancelData || !cancelData.reason) {
    throw new Error("Cancellation reason is required.");
  }
  const url = `${BASE_PATH}/${requestId}/cancel/`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cancelData),
  };
  const res = await authFetch(url, options);
  return handleResponse(res, "Cancel Transfer");
}

/**
 * Fetch eligible target classes for completing a transfer.
 */
export async function fetchEligibleTargetClasses(
  transferRequestId: number
): Promise<TargetClass[]> {
  // Uses updated TargetClass interface
  if (!transferRequestId) return [];
  const url = `${BASE_PATH}/${transferRequestId}/eligible-classes/`;
  const res = await authFetch(url);
  const data = await handleResponse(res, "Fetch Eligible Classes");
  return Array.isArray(data) ? data : [];
}

// --- Lookup Functions (Keep existing implementations or adapt as needed) ---
export async function searchSchoolsForLookup(searchTerm: string = "") {
  const queryParams: Record<string, string> = {};
  if (searchTerm) {
    queryParams["search"] = searchTerm;
  }
  const url = buildUrl("/schools/lookup/", queryParams); // Adjust endpoint if needed
  try {
    const res = await authFetch(url);
    const data = await handleResponse(res, "Search Schools");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to search schools:", error);
    return [];
  }
}

export async function searchStudentsForLookup(
  searchTerm: string = ""
): Promise<StudentSimple[]> {
  const queryParams: Record<string, string> = {};
  if (searchTerm) {
    queryParams["search"] = searchTerm;
  }
  const url = buildUrl("/students/lookup/", queryParams); // Adjust endpoint if needed
  try {
    const res = await authFetch(url);
    const data = await handleResponse(res, "Search Students");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to search students:", error);
    return [];
  }
}
