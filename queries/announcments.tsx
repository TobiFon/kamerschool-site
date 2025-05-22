import { authFetch } from "@/lib/auth";
import { AnnouncementResponse, Announcement } from "@/types/announcements";
export async function fetchAnnouncements(params?: {
  page?: number;
  target?: string;
  is_urgent?: boolean;
  sort?: string;
}): Promise<AnnouncementResponse> {
  const queryParams = new URLSearchParams();

  if (params?.target) {
    queryParams.append("target", params.target);
  }

  if (params?.is_urgent !== undefined) {
    queryParams.append("is_urgent", params.is_urgent.toString());
  }

  if (params?.sort) {
    queryParams.append("sort", params.sort);
  }

  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }

  const url = `${
    process.env.NEXT_PUBLIC_API_URL
  }/announcements/?${queryParams.toString()}`;
  const res = await authFetch(url);
  if (!res.ok) {
    throw new Error("failed to fetch announcements");
  }
  return res.json();
}

export async function fetchAnnouncementById(id: number): Promise<Announcement> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/announcements/${id}/`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch announcement with ID ${id}`);
  }

  return res.json();
}

export async function createAnnouncement(
  data: Partial<Announcement>
): Promise<Announcement> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/announcements/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create announcement");
  }

  return res.json();
}

export async function updateAnnouncement(
  id: number,
  data: Partial<Announcement>
): Promise<Announcement> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/announcements/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update announcement");
  }

  return res.json();
}

export async function deleteAnnouncement(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/announcements/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete announcement");
  }
}
