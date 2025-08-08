// src/queries/jobs.ts
import { axiosInstance } from "@/lib/axios";
import { BulkJob, BulkJobPayload } from "@/types/jobs"; // We'll define these types next

/**
 * Creates a new bulk report card generation job on the backend.
 * @param payload - The parameters for the job (class, year, term, etc.).
 * @returns The initial job object with a 'PENDING' status.
 */
export const createBulkReportJob = async (
  payload: BulkJobPayload
): Promise<BulkJob> => {
  const response = await axiosInstance.post(
    "/results/bulk-report-jobs/",
    payload
  );
  return response.data;
};

/**
 * Fetches a list of all bulk report card jobs initiated by the current user.
 * @returns An array of job objects.
 */
export const fetchBulkReportJobs = async (): Promise<BulkJob[]> => {
  const response = await axiosInstance.get("/results/bulk-report-jobs/");
  return response.data;
};

/**
 * Fetches the details and current status of a single bulk report card job.
 * @param jobId - The ID of the job to fetch.
 * @returns A single job object with its latest status.
 */
export const fetchBulkReportJobById = async (
  jobId: number
): Promise<BulkJob> => {
  const response = await axiosInstance.get(
    `/results/bulk-report-jobs/${jobId}/`
  );
  return response.data;
};
