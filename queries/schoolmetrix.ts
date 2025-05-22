import { authFetch } from "@/lib/auth";
import { SchoolMetrics, SchoolPerformanceOverviewProps } from "@/types/metrics";
import { format } from "date-fns";

export async function fetchAttendanceMetrics(startDate, endDate) {
  const formattedStart = format(startDate, "yyyy-MM-dd");
  const formattedEnd = format(endDate, "yyyy-MM-dd");
  const url = `${process.env.NEXT_PUBLIC_API_URL}/attendance/metrics/?from_date=${formattedStart}&to_date=${formattedEnd}`;

  console.log("Fetching URL:", url);

  try {
    const res = await authFetch(url);
    console.log("Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Failed to fetch attendance metrics: ${res.status} ${errorText}`
      );
    }

    const data = await res.json();
    console.log("Response data:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export async function fetchSchoolMetrics(): Promise<SchoolMetrics> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/schools/metrics`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch school metrics");
  }
  return res.json();
}
