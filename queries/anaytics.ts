import { authFetch } from "@/lib/auth";

/**
 * Builds a URL with query parameters, filtering out undefined or null values.
 * @param {string} baseUrl - The base URL for the API endpoint
 * @param {Object} params - Key-value pairs of query parameters
 * @returns {string} The constructed URL with query parameters
 */
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

/**
 * Fetches consolidated performance metrics for a student at sequence, term, or year level.
 * @param {number} studentId - The ID of the student
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.timeScope] - Time scope: 'sequence', 'term', or 'year' (default: current active period)
 * @param {number} [options.periodId] - Specific sequence_id, term_id, or year_id
 * @param {number} [options.academicYearId] - Specific academic year ID
 * @returns {Promise<Object|null>} The student's performance data or null if not found.
 * @throws {Error} If the request fails for reasons other than not found.
 */
export async function fetchStudentPerformance(studentId, options = {}) {
  const { timeScope, periodId, academicYearId } = options;
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/students/${studentId}/performance/`;
  const url = buildUrl(baseUrl, {
    time_scope: timeScope,
    period_id: periodId,
    academic_year_id: academicYearId,
  });

  try {
    const res = await authFetch(url);
    if (res.status === 404) {
      console.warn(`No performance data found for student ${studentId}`);
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.error ||
          `Failed to fetch student performance: ${res.statusText}`
      );
    }
    const data = await res.json();
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.warn(`Empty performance data (200 OK) for student ${studentId}`);
      return null;
    }
    return data;
  } catch (error) {
    console.error(
      `Error fetching performance for student ${studentId}:`,
      error
    );
    // If it's a 404 that somehow wasn't caught, treat as null. Otherwise, rethrow.
    if (error.message && error.message.toLowerCase().includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches comprehensive performance metrics for a class.
 * @param {number} classId - The ID of the class
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.timeScope] - Time scope: 'sequence', 'term', or 'year' (default: current active period)
 * @param {number} [options.periodId] - Specific sequence_id, term_id, or year_id
 * @param {number} [options.academicYearId] - Specific academic year ID
 * @returns {Promise<Object|null>} The class performance data or null if not found.
 * @throws {Error} If the request fails for reasons other than not found.
 */
export async function fetchClassPerformance(classId, options = {}) {
  const { timeScope, periodId, academicYearId } = options;
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/classes/${classId}/performance/`;
  const url = buildUrl(baseUrl, {
    time_scope: timeScope,
    period_id: periodId,
    academic_year_id: academicYearId,
  });

  try {
    const res = await authFetch(url);
    if (res.status === 404) {
      console.warn(`No performance data found for class ${classId}`);
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.error ||
          `failed to fetch class performance: ${res.statusText}`
      );
    }
    const data = await res.json();
    if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
      console.warn(`Empty performance data (200 OK) for class ${classId}`);
      return null;
    }
    return data;
  } catch (error) {
    console.error(`error fetching performance for class ${classId}:`, error);
    if (error.message && error.message.toLowerCase().includes("404")) {
      return null;
    }
    if (error.message && error.message.toLowerCase().includes("no data"))
      return null; // Defensive
    throw error;
  }
}

/**
 * Fetches a high-level overview of school performance.
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.timeScope] - Time scope: 'sequence', 'term', or 'year' (default: current active period)
 * @param {number} [options.periodId] - Specific sequence_id, term_id, or year_id
 * @param {number} [options.academicYearId] - Specific academic year ID
 * @returns {Promise<Object|null>} The school performance data or null if not found.
 * @throws {Error} If the request fails for reasons other than not found.
 */
export async function fetchSchoolPerformance(options = {}) {
  const { timeScope, periodId, academicYearId } = options;
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/school/performance/`;
  const url = buildUrl(baseUrl, {
    time_scope: timeScope,
    period_id: periodId,
    academic_year_id: academicYearId,
  });

  try {
    const res = await authFetch(url);

    if (res.status === 404) {
      // Handle 404 specifically
      console.warn(
        `No school performance data found for scope: ${timeScope}, period: ${periodId}. API returned 404.`
      );
      return null; // Indicate no data found
    }

    if (!res.ok) {
      // Handle other errors
      const errorData = await res
        .json()
        .catch(() => ({ message: res.statusText }));
      throw new Error(
        errorData.detail || // Common for DRF validation errors
          errorData.error ||
          errorData.message || // Fallback message from catch
          `Failed to fetch school performance: ${res.status}`
      );
    }

    const data = await res.json();

    // Handle cases where API returns 200 OK but with an empty object
    if (data && typeof data === "object" && Object.keys(data).length === 0) {
      console.warn(
        `Empty school performance data (200 OK) received for scope: ${timeScope}, period: ${periodId}`
      );
      return null; // Treat empty object as no data
    }

    return data;
  } catch (error) {
    console.error("Error in fetchSchoolPerformance:", error.message);
    // If a 404 error was somehow thrown instead of being caught above, or if a generic error indicates "not found"
    if (
      error.message &&
      (error.message.includes("404") ||
        error.message.toLowerCase().includes("not found"))
    ) {
      return null;
    }
    // For other errors, TanStack Query will catch them and put them in the `error` state.
    // The component's `if (error)` block will then handle displaying an error message.
    throw error;
  }
}

/**
 * Fetches subject performance analysis across the school.
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.timeScope] - Time scope: 'sequence', 'term', or 'year' (default: current active period)
 * @param {number} [options.periodId] - Specific sequence_id, term_id, or year_id
 * @param {number} [options.academicYearId] - Specific academic year ID
 * @returns {Promise<Object|null>} The subject analysis data or null if not found.
 * @throws {Error} If the request fails for reasons other than not found.
 */
export async function fetchSchoolSubjectAnalysis(options = {}) {
  const { timeScope, periodId, academicYearId } = options;
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/school/subjects/`;
  const url = buildUrl(baseUrl, {
    time_scope: timeScope,
    period_id: periodId,
    academic_year_id: academicYearId,
  });

  try {
    const res = await authFetch(url);
    if (res.status === 404) {
      console.warn(
        `No school subject analysis found for scope: ${timeScope}, period: ${periodId}.`
      );
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.error ||
          `Failed to fetch subject analysis: ${res.statusText}`
      );
    }
    const data = await res.json();
    if (
      data &&
      ((Array.isArray(data) && data.length === 0) ||
        (typeof data === "object" &&
          Object.keys(data).length === 0 &&
          !Array.isArray(data)))
    ) {
      console.warn(
        `Empty school subject analysis (200 OK) for scope: ${timeScope}, period: ${periodId}`
      );
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error fetching school subject analysis:", error);
    if (
      error.message &&
      (error.message.includes("404") ||
        error.message.toLowerCase().includes("not found"))
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches performance comparison across all classes in the school.
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.timeScope] - Time scope: 'sequence', 'term', or 'year' (default: current active period)
 * @param {number} [options.periodId] - Specific sequence_id, term_id, or year_id
 * @param {number} [options.academicYearId] - Specific academic year ID
 * @returns {Promise<Object|null>} The class comparison data or null if not found.
 * @throws {Error} If the request fails for reasons other than not found.
 */
export async function fetchSchoolClassComparison(options = {}) {
  const { timeScope, periodId, academicYearId } = options;
  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/results/metrics/school/classes/`;
  const url = buildUrl(baseUrl, {
    time_scope: timeScope,
    period_id: periodId,
    academic_year_id: academicYearId,
  });

  try {
    const res = await authFetch(url);
    if (res.status === 404) {
      console.warn(
        `No school class comparison found for scope: ${timeScope}, period: ${periodId}.`
      );
      return null;
    }
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          errorData.error ||
          `Failed to fetch class comparison: ${res.statusText}`
      );
    }
    const data = await res.json();
    if (
      data &&
      ((Array.isArray(data) && data.length === 0) ||
        (typeof data === "object" &&
          Object.keys(data).length === 0 &&
          !Array.isArray(data)))
    ) {
      console.warn(
        `Empty school class comparison (200 OK) for scope: ${timeScope}, period: ${periodId}`
      );
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error fetching school class comparison:", error);
    if (
      error.message &&
      (error.message.includes("404") ||
        error.message.toLowerCase().includes("not found"))
    ) {
      return null;
    }
    throw error;
  }
}
