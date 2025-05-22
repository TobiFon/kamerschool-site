import { authFetch } from "@/lib/auth";
import { SearchResponse } from "@/types/search";

export const searchKeys = {
  all: ["search"] as const,
  query: (q: string) => [...searchKeys.all, q] as const,
};

export async function searchGlobal(query: string): Promise<SearchResponse> {
  if (!query.trim()) {
    return {
      announcements: [],
      calendar_events: [],
      classes: [],
      students: [],
    };
  }

  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/search/`);
  url.searchParams.set("q", query);

  const res = await authFetch(url.toString());
  if (!res.ok) {
    throw new Error("Search failed");
  }

  return res.json();
}
