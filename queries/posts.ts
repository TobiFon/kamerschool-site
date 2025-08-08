// src/queries/posts.ts
import { authFetch } from "@/lib/auth";
import {
  Post,
  PostResponse,
  Comment,
  CommentResponse,
  Media,
} from "@/types/posts";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ============================================================================
// Posts API
// ============================================================================

export async function fetchPosts(params?: {
  page?: number;
  is_published?: boolean;
  ordering?: string;
  search?: string;
}): Promise<PostResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.is_published !== undefined)
    queryParams.append("is_published", params.is_published.toString());
  if (params?.ordering) queryParams.append("ordering", params.ordering);
  if (params?.search) queryParams.append("search", params.search);

  const res = await authFetch(
    `${API_URL}/posts/posts/?${queryParams.toString()}`
  );
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

// createPost now only handles text data
export async function createPost(postData: Partial<Post>): Promise<Post> {
  const res = await authFetch(`${API_URL}/posts/posts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

// updatePost now only handles text data
export async function updatePost(
  id: number,
  postData: Partial<Post>
): Promise<Post> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(postData),
  });
  if (!res.ok) throw new Error("Failed to update post");
  return res.json();
}

export async function deletePost(id: number): Promise<void> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete post");
}

export async function publishPost(id: number): Promise<{ status: string }> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/publish/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to publish post");
  return res.json();
}

export async function unpublishPost(id: number): Promise<{ status: string }> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/unpublish/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to unpublish post");
  return res.json();
}

export async function likePost(
  id: number
): Promise<{ status: string; likes_count: number }> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/like/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to like post");
  return res.json();
}

export async function unlikePost(
  id: number
): Promise<{ status: string; likes_count: number }> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/unlike/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to unlike post");
  return res.json();
}

export async function trackPostView(
  id: number
): Promise<{ views_count: number }> {
  const res = await authFetch(`${API_URL}/posts/posts/${id}/track_view/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to track post view");
  return res.json();
}

// ============================================================================
// Media API
// ============================================================================

export async function bulkCreateMedia(
  postId: number,
  files: File[]
): Promise<Media[]> {
  const formData = new FormData();
  formData.append("post_id", postId.toString());
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  const res = await authFetch(`${API_URL}/posts/media/bulk_create/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to upload media");
  }
  return res.json();
}

export async function updatePostMedia(
  postId: number,
  files: File[]
): Promise<Media[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  const res = await authFetch(
    `${API_URL}/posts/posts/${postId}/clear_and_set_media/`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to update media");
  }
  return res.json();
}

// ============================================================================
// Comments API
// ============================================================================

export async function fetchComments(params: {
  post: number;
  page?: number;
}): Promise<CommentResponse> {
  const queryParams = new URLSearchParams({ post: params.post.toString() });
  if (params.page) queryParams.append("page", params.page.toString());

  const res = await authFetch(
    `${API_URL}/posts/comments/?${queryParams.toString()}`
  );
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function createComment(data: {
  post: number;
  parent?: number;
  content: string;
}): Promise<Comment> {
  const res = await authFetch(`${API_URL}/posts/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}

export async function deleteComment(id: number): Promise<void> {
  const res = await authFetch(`${API_URL}/posts/comments/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete comment");
}

export async function pinComment(id: number): Promise<{ status: string }> {
  const res = await authFetch(`${API_URL}/posts/comments/${id}/pin/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to pin comment");
  return res.json();
}

export async function unpinComment(id: number): Promise<{ status: string }> {
  const res = await authFetch(`${API_URL}/posts/comments/${id}/unpin/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to unpin comment");
  return res.json();
}

export async function likeComment(
  id: number
): Promise<{ status: string; likes_count: number }> {
  const res = await authFetch(`${API_URL}/posts/comments/${id}/like/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to like comment");
  return res.json();
}

export async function unlikeComment(
  id: number
): Promise<{ status: string; likes_count: number }> {
  const res = await authFetch(`${API_URL}/posts/comments/${id}/unlike/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to unlike comment");
  return res.json();
}
