import { authFetch } from "@/lib/auth";
import { ActivityLog } from "@/types/activitylogs";
import { PaginatedResponse } from "@/types/auth";

export async function fetchActivityLogs(): Promise<
  PaginatedResponse<ActivityLog>
> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/schools/recent-activities/`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch activity logs");
  }
  return res.json();
}
