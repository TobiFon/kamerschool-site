export interface SearchResult {
  id: string;
  type: "announcement" | "calendar_event" | "class" | "student";
  title?: string;
  full_name?: string;
  name?: string;
  matricule?: string;
  code?: string;
}

export interface SearchResponse {
  announcements: SearchResult[];
  calendar_events: SearchResult[];
  classes: SearchResult[];
  students: SearchResult[];
}
