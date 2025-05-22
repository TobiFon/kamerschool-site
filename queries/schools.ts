import { authFetch } from "@/lib/auth";
import { School } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function updateSchoolDetails(
  schoolId: number | string,
  data: Partial<School>,
  logoFile?: File | null
): Promise<School> {
  let body: FormData | string;
  const headers: HeadersInit = {};

  if (logoFile) {
    // Use FormData if a logo file is provided
    body = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      // Append non-file data; skip ID and timestamps
      if (
        value !== null &&
        value !== undefined &&
        !["id", "created_at", "updated_at", "school_id", "logo"].includes(key)
      ) {
        body.append(key, String(value));
      }
    });
    body.append("logo", logoFile, logoFile.name);
    // Don't set Content-Type header manually for FormData; browser does it with boundary
  } else {
    // Use JSON for text-only updates
    const payload = { ...data };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.school_id;
    delete payload.logo; // Remove logo URL if no new file
    body = JSON.stringify(payload);
    headers["Content-Type"] = "application/json";
  }

  const res = await authFetch(`${API_URL}/schools/${schoolId}/`, {
    method: "PATCH",
    body: body,
    headers: headers, // Pass constructed headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Update School Error:", errorData);
    throw new Error(
      errorData.detail ||
        Object.values(errorData).join(", ") ||
        "Failed to update school details"
    );
  }
  return res.json();
}

// changeSchoolPassword implemented within SecurityTab for simplicity, or move here.

// === Staff API Functions ===

export async function fetchStaffList() {
  const res = await authFetch(`${API_URL}/schools/staff/`);
  if (!res.ok) throw new Error("Failed to fetch staff list");
  return res.json();
}

// Define InviteStaffData type based on backend requirements
interface InviteStaffData {
  email: string;
  full_name?: string;
  permission_level?: "read" | "edit" | "admin";
}

// Define response type from backend invite action
interface InviteStaffResponse {
  message: string;
  staff_id: number;
  username?: string; // Optional, as backend might not return if user existed
  temporary_password?: string; // Optional, highly discouraged in production
}

export async function inviteStaff(
  data: InviteStaffData
): Promise<InviteStaffResponse> {
  const res = await authFetch(`${API_URL}/schools/staff/invite/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Check for specific backend errors
    if (
      res.status === 400 &&
      errorData.error?.includes("already a staff member")
    ) {
      throw new Error("StaffExists"); // Custom error flag
    }
    throw new Error(errorData.error || "Failed to invite staff");
  }
  return res.json();
}

// Define UpdateStaffData type
interface UpdateStaffData {
  permission_level?: "read" | "edit" | "admin";
  position?: string;
}

export async function updateStaffMember(
  staffId: number | string,
  data: UpdateStaffData
) {
  const res = await authFetch(`${API_URL}/schools/staff/${staffId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update staff member");
  }
  return res.json();
}

// Define ResetPasswordResponse type
interface ResetPasswordResponse {
  message: string;
  temporary_password?: string; // Discouraged
}

export async function resetStaffPassword(
  staffId: number | string
): Promise<ResetPasswordResponse> {
  const res = await authFetch(
    `${API_URL}/schools/staff/${staffId}/reset_password/`,
    {
      method: "POST",
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to reset password");
  }
  return res.json();
}

export async function deleteStaffMember(
  staffId: number | string
): Promise<void> {
  const res = await authFetch(`${API_URL}/schools/staff/${staffId}/`, {
    method: "DELETE",
  });
  // DELETE often returns 204 No Content on success
  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete staff member");
  }
  // No JSON body to return on success (204)
}
