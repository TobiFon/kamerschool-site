export interface Announcement {
  id: number;
  user: {
    id: number;
    username: string;
  };
  target: "school" | "class";
  target_class?: {
    id: number;
    name: string;
  };
  title: string;
  content: string;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Announcement[];
}
