// src/types/posts.ts

export interface Media {
  id: number;
  media_type: "image" | "video";
  file: string; // URL to the original media file
  processed_file: string | null; // URL to the web-optimized file
  thumbnail: string | null; // URL to the video thumbnail
  is_processed: boolean;
  created_at: string;
}

export interface Comment {
  id: number;
  post: number;
  parent: number | null;
  user: string; // User's name or username
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  likes_count: number;
  user_has_liked: boolean;
  replies: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  school: number;
  author: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  media: Media[];
  comments: Comment[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  created_at: string;
  updated_at: string;
  user?: { name: string }; // Optional user object from backend
}

export interface PostResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}

export interface CommentResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Comment[];
}
