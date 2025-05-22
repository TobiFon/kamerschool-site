import { authFetch } from "@/lib/auth";
import { Sequence, StudentEnrollmentHistoryItem } from "@/types/results";

export async function fetchAcademicYears() {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/academic-years/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch academic years");
  }
  return res.json();
}

export async function fetchTerms(academicYearId: number) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/terms/?academic_year=${academicYearId}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch terms for academic year ${academicYearId}`
    );
  }
  return res.json();
}

export async function fetchSequences(termId: number) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequences/?term=${termId}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch sequences for term ${termId}`);
  }
  return res.json();
}

export async function createSequence(sequenceData) {
  // sequenceData should include the term ID and the sequence name, for example:
  // { term: 1, name: "First Sequence" }
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequences/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sequenceData),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create sequence");
  }
  return res.json();
}
export async function updateSequence(sequenceId, updateData) {
  // updateData should contain the fields you want to update, e.g., { term: 1, name: "Updated Sequence" }
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequences/${sequenceId}/`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update sequence with id ${sequenceId}`);
  }
  return res.json();
}

export async function deleteSequence(sequenceId) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequences/${sequenceId}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to delete sequence with id ${sequenceId}`);
  }
  // DELETE responses often don't return data
  return true;
}

// NEW: Fetch student's enrollment history
export async function fetchStudentEnrollmentHistory(
  studentId: string
): Promise<StudentEnrollmentHistoryItem[]> {
  if (!studentId)
    throw new Error("Student ID is required to fetch enrollment history.");
  // Assume an endpoint like this exists or create it.
  // This endpoint should return a list of enrollments with year and school info.
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}/enrollment-history/`
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || "Failed to fetch student enrollment history"
    );
  }
  return res.json();
}

// NEW: Fetch historical sequences for a student in a specific school and term/year
export async function fetchStudentHistoricalSequences(params: {
  studentId: string;
  academicYearId: string | number; // The year of the historical record
  termId?: string | number | null; // Optional: further filter by term
}): Promise<Sequence[]> {
  const { studentId, academicYearId, termId } = params;
  if (!studentId || !academicYearId) {
    throw new Error("Student ID and Academic Year ID are required.");
  }

  let queryString = `academic_year_id=${academicYearId}`;
  if (termId != null) {
    queryString += `&term_id=${termId}`;
  }

  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}/historical-sequences/?${queryString}`
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Try to parse error
    throw new Error(
      errorData.detail || "Failed to fetch historical sequences for student."
    );
  }
  return res.json();
}

export async function fetchSequenceOverallResults(
  sequenceId,
  classId,
  page,
  pageSize,
  sortColumn,
  sortDirection
) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-results/${sequenceId}/?class_id=${classId}&page=${page}&page_size=${pageSize}&sortColumn=${sortColumn}&sortDirection=${sortDirection}`
  );
  if (!res.ok) {
    throw new Error(
      `failed to fetch sequence results for sequence ${sequenceId}`
    );
  }
  return res.json();
}

export async function fetchSequenceScores(sequenceId: number, classId: number) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/scores/?sequence_id=${sequenceId}&class_id=${classId}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch sequence scores for sequence ${sequenceId} and class ${classId}`
    );
  }
  return res.json();
}

export async function fetchSubjectSequenceScores(
  sequenceId,
  classId,
  subjectId
) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/subject-sequence-scores/?sequence_id=${sequenceId}&class_id=${classId}&class_subject_id=${subjectId}`
  );
  if (!res.ok) {
    throw new Error(
      `Failed to fetch subject scores for sequence ${sequenceId}, class ${classId}, and subject ${subjectId}`
    );
  }
  return res.json();
}

export async function submitBulkSubjectScores(
  sequenceId,
  classId,
  classSubjectId,
  scores
) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/bulk-subject-scores/?sequence_id=${sequenceId}&class_subject_id=${classSubjectId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scores }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to submit scores for sequence ${sequenceId}, class ${classId}, and subject ${classSubjectId}`
    );
  }

  return res.json();
}
export async function fetchSequenceClassSubjectConfig(
  sequenceId,
  classSubjectId
) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-class-subjects/?sequence_id=${sequenceId}&class_subject_id=${classSubjectId}`
  );
  if (!res.ok) {
    throw new Error(
      `failed to fetch sequence class subject config for sequence ${sequenceId} and class subject ${classSubjectId}`
    );
  }
  return res.json();
}

export async function submitSequenceClassSubjectConfig({
  sequenceId,
  classSubjectId,
  weight,
  baseScore,
  isActive = true,
}) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-class-subjects/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sequence_id: sequenceId,
        class_subject_id: classSubjectId,
        weight,
        base_score: baseScore,
        is_active: isActive,
      }),
    }
  );
  if (!res.ok) {
    throw new Error(
      `failed to submit sequence class subject config for sequence ${sequenceId} and class subject ${classSubjectId}`
    );
  }
  return res.json();
}

export async function recalculateSubjectRanks(sequenceId, classId, subjectId) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/recalculate-ranks/?sequence_id=${sequenceId}&class_id=${classId}&class_subject_id=${subjectId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) {
    throw new Error(
      `Failed to recalculate ranks for sequence ${sequenceId}, class ${classId}, and subject ${subjectId}`
    );
  }
  return res.json();
}

export async function calculateSequenceOverallResults(sequenceId, classId) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-results/calculate/${sequenceId}/?class_id=${classId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to calculate sequence overall results for sequence ${sequenceId} and class ${classId}`
    );
  }
  return res.json();
}
/**
 * Publish or unpublish sequence scores with various filtering options
 */
export async function publishSequenceScores(
  sequenceId: number,
  classId: number,
  publish: boolean,
  options?: {
    studentIds?: number[];
    classSubjectId?: number;
  }
) {
  const requestBody: any = { publish };

  // Add optional filters if provided
  if (options?.studentIds && options.studentIds.length > 0) {
    requestBody.student_ids = options.studentIds;
  }

  if (options?.classSubjectId) {
    requestBody.class_subject_id = options.classSubjectId;
  }

  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-scores/publish/${sequenceId}/?class_id=${classId}`,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to publish sequence scores: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Publish or unpublish sequence overall results with student filtering option
 */
export async function publishSequenceOverallResults(
  sequenceId: number,
  classId: number,
  publish: boolean,
  options?: {
    studentIds?: number[];
  }
) {
  const requestBody: any = { publish };

  // Add student IDs filter if provided
  if (options?.studentIds && options.studentIds.length > 0) {
    requestBody.student_ids = options.studentIds;
  }

  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/results/sequence-results/publish/${sequenceId}/?class_id=${classId}`,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to publish overall results: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Helper function to publish/unpublish scores for a specific class subject
 */
export async function publishClassSubjectScores(
  sequenceId: number,
  classId: number,
  classSubjectId: number,
  publish: boolean,
  studentIds?: number[]
) {
  return publishSequenceScores(sequenceId, classId, publish, {
    classSubjectId,
    studentIds,
  });
}

/**
 * Helper function to publish/unpublish results for selected students
 */
export async function publishStudentResults(
  sequenceId: number,
  classId: number,
  studentIds: number[],
  publish: boolean
) {
  return publishSequenceOverallResults(sequenceId, classId, publish, {
    studentIds,
  });
}

/**
 * API service for term results and term overall results
 */

/**
 * Fetch term results with pagination and optional filtering/sorting
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @param {Object} options - Optional parameters
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Page size (default: 10)
 * @param {string} options.sortColumn - Column to sort by
 * @param {string} options.sortDirection - Sort direction ('asc' or 'desc')
 * @param {number} options.classSubjectId - Optional filter by class subject ID
 * @returns {Promise<Object>} Paginated results with class subject info if filtered
 */
export async function fetchTermResults(termId, classId, options = {}) {
  const {
    page = 1,
    pageSize = 10,
    sortColumn = "",
    sortDirection = "",
    classSubjectId = null,
  } = options;

  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
  });

  // Add optional params
  if (sortColumn) queryParams.append("sort_column", sortColumn);
  if (sortDirection) queryParams.append("sort_direction", sortDirection);
  if (classSubjectId) queryParams.append("class_subject_id", classSubjectId);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-results/${termId}/?${queryParams}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to fetch term results for term ${termId} (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching term results:", error);
    throw error;
  }
}

/**
 * Trigger calculation of term results
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @param {number} classSubjectId - Optional class subject ID to calculate results for a specific subject
 * @returns {Promise<Object>} Result of the calculation operation
 */
export async function calculateTermResults(termId, classId, classSubjectId) {
  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
  });

  if (classSubjectId) queryParams.append("class_subject_id", classSubjectId);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-results/${termId}/?${queryParams}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to calculate term results for term ${termId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error calculating term results:", error);
    throw error;
  }
}

/**
 * Fetch overall term results with pagination and optional filtering
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @param {Object} options - Optional parameters
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Page size (default: 10)
 * @param {string} options.sortBy - Field to sort by (e.g., 'rank', 'average')
 * @param {string} options.sortDirection - Sort direction ('asc' or 'desc')
 * @returns {Promise<Object>} Paginated overall results with class statistics
 */
export async function fetchTermOverallResults(termId, classId, options = {}) {
  const { page = 1, pageSize = 10, sortBy = "", sortDirection = "" } = options;

  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
    page,
    page_size: pageSize,
  });

  // Add optional params
  if (sortBy) queryParams.append("sortColumn", sortBy);
  if (sortDirection) queryParams.append("sortDirection", sortDirection);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-overall-results/${termId}/?${queryParams}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to fetch overall term results for term ${termId} (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching term overall results:", error);
    throw error;
  }
}

/**
 * Trigger calculation of overall term results
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @returns {Promise<Object>} Result of the calculation operation
 */
export async function calculateTermOverallResults(termId, classId) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-overall-results/${termId}/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to calculate overall term results for term ${termId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error calculating term overall results:", error);
    throw error;
  }
}

/**
 * Publish or unpublish term results (bulk action)
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @param {boolean} publish - Whether to publish (true) or unpublish (false)
 * @param {Object} options - Optional parameters
 * @param {Array<number>} options.studentIds - Array of student IDs to filter by
 * @param {number} options.classSubjectId - Optional class subject ID to filter by
 * @returns {Promise<Object>} Result of the publish operation
 */
export async function publishTermResults(
  termId,
  classId,
  publish,
  options = {}
) {
  const { studentIds = [], classSubjectId = null } = options;

  // Build request body
  const requestBody = { publish };
  if (studentIds.length > 0) {
    requestBody.student_ids = studentIds;
  }
  if (classSubjectId) {
    requestBody.class_subject_id = classSubjectId;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-results/${termId}/publish/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to ${
            publish ? "publish" : "unpublish"
          } term results for term ${termId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error ${publish ? "publishing" : "unpublishing"} term results:`,
      error
    );
    throw error;
  }
}

/**
 * Publish or unpublish overall term results (bulk action)
 * @param {number} termId - The term ID
 * @param {number} classId - The class ID (required)
 * @param {boolean} publish - Whether to publish (true) or unpublish (false)
 * @param {Object} options - Optional parameters
 * @param {Array<number>} options.studentIds - Array of student IDs to filter by
 * @returns {Promise<Object>} Result of the publish operation
 */
export async function publishTermOverallResults(
  termId,
  classId,
  publish,
  options = {}
) {
  const { studentIds = [] } = options;

  // Build request body
  const requestBody = { publish };
  if (studentIds.length > 0) {
    requestBody.student_ids = studentIds;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-overall-results/${termId}/publish/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to ${
            publish ? "publish" : "unpublish"
          } overall term results for term ${termId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error ${publish ? "publishing" : "unpublishing"} term overall results:`,
      error
    );
    throw error;
  }
}

/**
 * Fetch list of available terms for a school with result counts
 * @param {number} classId - The class ID (required)
 * @returns {Promise<Array>} List of terms with result counts
 */
export async function fetchTermsList(classId) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-results/?class_id=${classId}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error || `Failed to fetch terms list (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching terms list:", error);
    throw error;
  }
}

/**
 * Fetch list of available terms with overall result counts
 * @param {number} classId - The class ID (required)
 * @returns {Promise<Array>} List of terms with overall result counts
 */
export async function fetchTermsWithOverallResultsList(classId) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/term-overall-results/?class_id=${classId}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to fetch terms with overall results (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching terms with overall results:", error);
    throw error;
  }
}
/**
 * Fetch yearly subject results with optional filtering/sorting
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @param {Object} options - Optional parameters
 * @param {string} options.sortColumn - Column to sort by (e.g., 'average_score', 'student_name')
 * @param {string} options.sortDirection - Sort direction ('asc' or 'desc')
 * @param {number} options.classSubjectId - Optional filter by class subject ID
 * @returns {Promise<Object>} Results with class subject info if filtered
 */
export async function fetchYearlySubjectResults(
  academicYearId,
  classId,
  options = {}
) {
  const {
    sortColumn = "",
    sortDirection = "",
    classSubjectId = null,
  } = options;

  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
  });

  // Add optional params
  if (sortColumn) queryParams.append("sort_column", sortColumn);
  if (sortDirection) queryParams.append("sort_direction", sortDirection);
  if (classSubjectId) queryParams.append("class_subject_id", classSubjectId);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-subject-results/${academicYearId}/?${queryParams}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to fetch yearly subject results for academic year ${academicYearId} (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching yearly subject results:", error);
    throw error;
  }
}
/**
 * Trigger calculation of yearly subject results
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @param {number} classSubjectId - Optional class subject ID to calculate results for a specific subject
 * @returns {Promise<Object>} Result of the calculation operation
 */
export async function calculateYearlySubjectResults(
  academicYearId,
  classId,
  classSubjectId = null
) {
  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
  });

  if (classSubjectId) queryParams.append("class_subject_id", classSubjectId);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-subject-results/${academicYearId}/?${queryParams}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to calculate yearly subject results for academic year ${academicYearId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error calculating yearly subject results:", error);
    throw error;
  }
}
/**
 * Fetch overall yearly results with pagination and optional filtering
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @param {Object} options - Optional parameters
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Page size (default: 10)
 * @param {string} options.sortBy - Field to sort by (e.g., 'class_rank', 'yearly_average')
 * @param {string} options.sortDirection - Sort direction ('asc' or 'desc')
 * @returns {Promise<Object>} Paginated overall results with class statistics
 */
export async function fetchYearlyOverallResults(
  academicYearId,
  classId,
  options = {}
) {
  const {
    page = 1,
    pageSize = 10,
    sortBy = "class_rank",
    sortDirection = "asc",
  } = options;

  // Build query params
  const queryParams = new URLSearchParams({
    class_id: classId,
    page,
    page_size: pageSize,
    sortColumn: sortBy,
    sortDirection,
  });

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-results/${academicYearId}/?${queryParams}`;

  try {
    const res = await authFetch(url);
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to fetch overall yearly results for academic year ${academicYearId} (Status: ${res.status})`
      );
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching yearly overall results:", error);
    throw error;
  }
}
/**
 * Trigger calculation of overall yearly results
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @returns {Promise<Object>} Result of the calculation operation
 */
export async function calculateYearlyOverallResults(academicYearId, classId) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-results/${academicYearId}/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to calculate overall yearly results for academic year ${academicYearId} (Status: ${res.status})`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error calculating yearly overall results:", error);
    throw error;
  }
}
/**
 * Publish or unpublish yearly subject results (bulk action)
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @param {boolean} publish - Whether to publish (true) or unpublish (false)
 * @param {Object} options - Optional parameters
 * @param {Array<number>} options.studentIds - Array of student IDs to filter by
 * @param {number} options.classSubjectId - Optional class subject ID to filter by
 * @returns {Promise<Object>} Result of the publish operation
 */
export async function publishYearlySubjectResults(
  academicYearId,
  classId,
  publish,
  options = {}
) {
  const { studentIds = [], classSubjectId = null } = options;

  // Build request body
  const requestBody = { publish };
  if (studentIds.length > 0) {
    requestBody.student_ids = studentIds;
  }
  if (classSubjectId) {
    requestBody.class_subject_id = classSubjectId;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-subject-results/${academicYearId}/publish/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to ${
            publish ? "publish" : "unpublish"
          } yearly subject results for academic year ${academicYearId} (Status: ${
            res.status
          })`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error ${
        publish ? "publishing" : "unpublishing"
      } yearly subject results:`,
      error
    );
    throw error;
  }
}
/**
 * Publish or unpublish overall yearly results (bulk action)
 * @param {number} academicYearId - The academic year ID
 * @param {number} classId - The class ID (required)
 * @param {boolean} publish - Whether to publish (true) or unpublish (false)
 * @param {Object} options - Optional parameters
 * @param {Array<number>} options.studentIds - Array of student IDs to filter by
 * @returns {Promise<Object>} Result of the publish operation
 */
export async function publishYearlyOverallResults(
  academicYearId,
  classId,
  publish,
  options = {}
) {
  const { studentIds = [] } = options;

  // Build request body
  const requestBody = { publish };
  if (studentIds.length > 0) {
    requestBody.student_ids = studentIds;
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/results/yearly-results/${academicYearId}/publish/?class_id=${classId}`;

  try {
    const res = await authFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(
        errorData?.error ||
          `Failed to ${
            publish ? "publish" : "unpublish"
          } overall yearly results for academic year ${academicYearId} (Status: ${
            res.status
          })`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      `Error ${
        publish ? "publishing" : "unpublishing"
      } yearly overall results:`,
      error
    );
    throw error;
  }
}
