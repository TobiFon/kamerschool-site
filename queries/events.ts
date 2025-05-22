import { authFetch } from "@/lib/auth";
import { CalendarEventResponse, EventFormValues } from "@/types/events";

export async function fetchCalendarEvents(params?: {
  url?: string;
  event_type?: string;
  is_recurring?: boolean;
  sort?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}): Promise<CalendarEventResponse> {
  let url: string;
  if (params?.url) {
    url = params.url;
  } else {
    const queryParams = new URLSearchParams();

    // Event type filter
    if (params?.event_type && params.event_type !== "all") {
      queryParams.append("event_type", params.event_type);
    }

    // Recurring filter
    if (params?.is_recurring !== undefined) {
      queryParams.append("is_recurring", params.is_recurring.toString());
    }

    // Sort order - simplified to use direct field names
    if (params?.sort) {
      // Use the proper backend-compatible sort parameter
      queryParams.append("sort", params.sort);
    } else {
      // Default to newest first
      queryParams.append("sort", "created_at_desc");
    }

    // Date range filters
    if (params?.start_date) {
      queryParams.append("start_date", params.start_date);
    }

    if (params?.end_date) {
      queryParams.append("end_date", params.end_date);
    }

    // Search query
    if (params?.search) {
      queryParams.append("search", params.search);
    }

    url = `${
      process.env.NEXT_PUBLIC_API_URL
    }/events/?${queryParams.toString()}`;
  }

  const res = await authFetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch calendar events");
  }
  return res.json();
}

export async function FetchCalendarEvent(id: number): Promise<any> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch calendar event");
  }

  return res.json();
}
export async function deleteCalendarEvent(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete calendar event");
  }
}

export async function createCalendarEvent(data: EventFormValues) {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/events/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("failed to create calendar event");
  }
  return res.json();
}

export async function updateCalendarEvent(id: number, data: EventFormValues) {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${id}/`,
    {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    throw new Error("failed to update calendar event");
  }
  return res.json();
}
