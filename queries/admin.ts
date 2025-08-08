import { authFetch } from "@/lib/auth";
import { PaginatedResponse, School } from "@/types/auth";
import { AcademicYear, Term } from "@/types/transfers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ADMIN_API_BASE = `${API_URL}/admin`;

//===========================================================================
// TYPES
//===========================================================================

export interface EducationSystem {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  abbreviation: string | null;
  description: string | null;
  school_level: "secondary" | "high_school" | null;
  education_system: EducationSystem | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Response for paginated subjects
export interface PaginatedSubjectsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subject[];
}

// Response for a full (non-paginated) list of subjects
export type FullSubjectsListResponse = Subject[];

type SubjectPayload = Omit<
  Subject,
  "id" | "created_at" | "updated_at" | "education_system" | "usage_count"
> & {
  education_system_id: number;
};

type TermPayload = Omit<Term, "id" | "academic_year_name"> & {
  academic_year: number;
};

//===========================================================================
// ADMIN DASHBOARD METRICS
//===========================================================================

export async function fetchAdminDashboardMetrics() {
  const res = await authFetch(`${ADMIN_API_BASE}/dashboard-metrics/`);
  if (!res.ok) {
    throw new Error("Failed to fetch admin dashboard metrics");
  }
  return res.json();
}

//===========================================================================
// SCHOOL MANAGEMENT
//===========================================================================

interface FetchSchoolsParams {
  page?: number;
  search?: string;
}

export async function fetchAllSchools(
  params: FetchSchoolsParams = {}
): Promise<PaginatedResponse<School>> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.search) query.append("search", params.search);

  const res = await authFetch(`${ADMIN_API_BASE}/schools/?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch schools");
  }
  return res.json();
}

export async function createSchool(data: FormData): Promise<School> {
  const res = await authFetch(`${ADMIN_API_BASE}/schools/`, {
    method: "POST",
    body: data,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to create school"
    );
  }
  return res.json();
}

export async function updateSchool({
  id,
  data,
}: {
  id: number;
  data: FormData;
}): Promise<School> {
  const res = await authFetch(`${ADMIN_API_BASE}/schools/${id}/`, {
    method: "PATCH",
    body: data,
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to update school"
    );
  }
  return res.json();
}

export async function deleteSchool(id: number): Promise<void> {
  const res = await authFetch(`${ADMIN_API_BASE}/schools/${id}/`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete school");
  }
}

//===========================================================================
// SUBJECT & EDUCATION SYSTEM MANAGEMENT
//===========================================================================

interface FetchSubjectsParams {
  search?: string;
  education_system?: string;
  school_level?: string;
  limit?: number;
  offset?: number;
  paginate?: "true" | "false"; // Explicitly control pagination
}

export async function fetchAllSubjects(
  params: FetchSubjectsParams = {}
): Promise<PaginatedSubjectsResponse | FullSubjectsListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.education_system && params.education_system !== "all") {
    query.append("education_system", params.education_system);
  }
  if (params.school_level && params.school_level !== "all") {
    query.append("school_level", params.school_level);
  }
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.offset) query.append("offset", params.offset.toString());
  if (params.paginate === "false") {
    query.append("paginate", "false");
  }

  const res = await authFetch(
    `${ADMIN_API_BASE}/subjects/?${query.toString()}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch subjects");
  }

  return res.json();
}

export async function fetchEducationSystems(): Promise<EducationSystem[]> {
  const res = await authFetch(`${ADMIN_API_BASE}/education-systems/`);
  if (!res.ok) {
    throw new Error("Failed to fetch education systems");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

export async function createSubject(data: SubjectPayload): Promise<Subject> {
  const res = await authFetch(`${ADMIN_API_BASE}/subjects/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to create subject"
    );
  }
  return res.json();
}

export async function updateSubject({
  id,
  data,
}: {
  id: number;
  data: Partial<SubjectPayload>;
}): Promise<Subject> {
  const res = await authFetch(`${ADMIN_API_BASE}/subjects/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to update subject"
    );
  }
  return res.json();
}

export async function deleteSubject(id: number): Promise<void> {
  const res = await authFetch(`${ADMIN_API_BASE}/subjects/${id}/`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete subject");
  }
}

//===========================================================================
// ACADEMIC PERIOD MANAGEMENT
//===========================================================================
export async function fetchAllAcademicYears(): Promise<AcademicYear[]> {
  const res = await authFetch(`${ADMIN_API_BASE}/academic-years/`);
  if (!res.ok) throw new Error("Failed to fetch academic years");
  const data = await res.json();
  return data.results || data;
}

export async function createAcademicYear(
  data: Partial<AcademicYear>
): Promise<AcademicYear> {
  const res = await authFetch(`${ADMIN_API_BASE}/academic-years/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") ||
        "Failed to create academic year"
    );
  }
  return res.json();
}

export async function updateAcademicYear({
  id,
  data,
}: {
  id: number;
  data: Partial<AcademicYear>;
}): Promise<AcademicYear> {
  const res = await authFetch(`${ADMIN_API_BASE}/academic-years/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") ||
        "Failed to update academic year"
    );
  }
  return res.json();
}

export async function deleteAcademicYear(id: number): Promise<void> {
  const res = await authFetch(`${ADMIN_API_BASE}/academic-years/${id}/`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete academic year");
  }
}

export async function createTerm(data: TermPayload): Promise<Term> {
  const res = await authFetch(`${ADMIN_API_BASE}/terms/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to create term"
    );
  }
  return res.json();
}

export async function updateTerm({
  id,
  data,
}: {
  id: number;
  data: Partial<TermPayload>;
}): Promise<Term> {
  const res = await authFetch(`${ADMIN_API_BASE}/terms/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to update term"
    );
  }
  return res.json();
}

export async function deleteTerm(id: number): Promise<void> {
  const res = await authFetch(`${ADMIN_API_BASE}/terms/${id}/`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete term");
  }
}

//===========================================================================
// SCHOOL-SPECIFIC QUERIES
//===========================================================================
export async function fetchSchoolById(id: number): Promise<School> {
  const res = await authFetch(`${ADMIN_API_BASE}/schools/${id}/`);
  if (!res.ok) {
    throw new Error("Failed to fetch school details");
  }
  return res.json();
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: string;
  total: string;
}

export interface InvoicePayment {
  id: number;
  payment_date: string;
  amount: string;
  payment_method: string;
  transaction_id: string | null;
  notes: string | null;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "PARTIALLY_PAID";
  status_display: string;
  notes: string | null;
  items: InvoiceItem[];
  invoice_payments: InvoicePayment[];
  total_amount: string;
  amount_paid: string;
  balance_due: string;
}

export async function fetchInvoicesForSchool(
  schoolId: number
): Promise<Invoice[]> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch invoices");
  }
  const data = await res.json();
  return data.results || data;
}

export type InvoicePayload = {
  issue_date: string;
  due_date: string;
  notes?: string;
  status: "DRAFT" | "SENT";
  items: {
    description: string;
    quantity: number;
    unit_price: number;
  }[];
};

export async function createInvoice({
  schoolId,
  data,
}: {
  schoolId: number;
  data: InvoicePayload;
}): Promise<Invoice> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to create invoice"
    );
  }
  return res.json();
}

export async function updateInvoice({
  schoolId,
  invoiceId,
  data,
}: {
  schoolId: number;
  invoiceId: number;
  data: Partial<InvoicePayload>;
}): Promise<Invoice> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/${invoiceId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to update invoice"
    );
  }
  return res.json();
}

export type PaymentPayload = {
  payment_date: string;
  amount: number;
  payment_method: "CASH" | "BANK_TRANSFER" | "MOBILE_MONEY" | "OTHER";
  transaction_id?: string;
  notes?: string;
};

export async function fetchInvoiceById({
  schoolId,
  invoiceId,
}: {
  schoolId: number;
  invoiceId: number;
}): Promise<Invoice> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/${invoiceId}/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch invoice details");
  }
  return res.json();
}

export async function recordPayment({
  schoolId,
  invoiceId,
  data,
}: {
  schoolId: number;
  invoiceId: number;
  data: PaymentPayload;
}): Promise<InvoicePayment> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/${invoiceId}/payments/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      Object.values(errorData).flat().join(", ") || "Failed to record payment"
    );
  }
  return res.json();
}

export async function deleteInvoice({
  schoolId,
  invoiceId,
}: {
  schoolId: number;
  invoiceId: number;
}): Promise<void> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/invoices/${invoiceId}/`,
    {
      method: "DELETE",
    }
  );
  if (res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete invoice");
  }
}

export interface SchoolDashboardData {
  key_metrics: {
    active_students: number;
    total_teachers: number;
    active_classes: number;
    active_academic_year: string;
  };
  financial_summary: {
    total_invoiced: number;
    total_paid: number;
    outstanding_balance: number;
  };
  recent_activity: {
    id: number;
    description: string;
    user: string;
    timestamp: string;
  }[];
}

export async function fetchSchoolDashboardData(
  schoolId: number
): Promise<SchoolDashboardData> {
  const res = await authFetch(
    `${ADMIN_API_BASE}/schools/${schoolId}/dashboard/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch school dashboard data");
  }
  return res.json();
}
