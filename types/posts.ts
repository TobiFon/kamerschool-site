// Define types for Post, Media, Comment
export interface Post {
  id: number;
  school: number;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  media?: Media[];
  comments?: Comment[];
}

export interface Media {
  id: number;
  post: number;
  media_type: "image" | "video";
  file: string;
  created_at: string;
}

export interface Comment {
  id: number;
  post: number;
  parent: number | null;
  user: number;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}
