import { authFetch } from "@/lib/auth";
import { Media, Post, PostResponse } from "@/types/posts";

// Posts API functions
export async function fetchPosts(params?: {
  page?: number;
  is_published?: boolean;
  ordering?: string;
  search?: string;
}): Promise<PostResponse> {
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }

  if (params?.is_published !== undefined) {
    queryParams.append("is_published", params.is_published.toString());
  }

  if (params?.ordering) {
    queryParams.append("ordering", params.ordering);
  }

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const url = `${
    process.env.NEXT_PUBLIC_API_URL
  }/posts/posts/?${queryParams.toString()}`;
  const res = await authFetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }

  return res.json();
}

export async function fetchPostById(id: number): Promise<Post> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch post with ID ${id}`);
  }

  return res.json();
}

export async function createPost(
  data: Partial<Post>,
  mediaFiles?: File[]
): Promise<Post> {
  if (!mediaFiles || mediaFiles.length === 0) {
    // Simple JSON post without files
    const res = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to create post");
    }

    return res.json();
  } else {
    // Form data for files
    const formData = new FormData();

    // Add post data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`media[${index}]file`, file);
      formData.append(
        `media[${index}]media_type`,
        file.type.startsWith("image/") ? "image" : "video"
      );
    });

    const res = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to create post with media");
    }

    return res.json();
  }
}

export async function updatePost(
  id: number,
  data: Partial<Post>,
  mediaFiles?: File[]
): Promise<Post> {
  if (!mediaFiles || mediaFiles.length === 0) {
    // Simple JSON update without files
    const res = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update post");
    }

    return res.json();
  } else {
    // Form data for files
    const formData = new FormData();

    // Add post data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append(`media[${index}]file`, file);
      formData.append(
        `media[${index}]media_type`,
        file.type.startsWith("image/") ? "image" : "video"
      );
    });

    const res = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/`,
      {
        method: "PATCH",
        body: formData,
      }
    );

    if (!res.ok) {
      throw new Error("Failed to update post with media");
    }

    return res.json();
  }
}

export async function deletePost(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete post");
  }
}

export async function publishPost(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/publish/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to publish post");
  }
}

export async function unpublishPost(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/unpublish/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to unpublish post");
  }
}

export async function likePost(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/like/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to like post");
  }
}

export async function unlikePost(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/unlike/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to unlike post");
  }
}

export async function trackPostView(
  id: number
): Promise<{ views_count: number }> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/posts/${id}/track_view/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to track post view");
  }

  return res.json();
}

export async function fetchComments(params?: {
  post?: number; // Changed to match the component parameter name
  is_pinned?: boolean;
  page?: number;
  ordering?: string;
  search?: string;
}): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: Comment[];
}> {
  const queryParams = new URLSearchParams();

  if (params?.post) {
    queryParams.append("post", params.post.toString());
  }

  if (params?.is_pinned !== undefined) {
    queryParams.append("is_pinned", params.is_pinned.toString());
  }

  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }

  if (params?.ordering) {
    queryParams.append("ordering", params.ordering);
  }

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const url = `${
    process.env.NEXT_PUBLIC_API_URL
  }/posts/comments/?${queryParams.toString()}`;

  console.log("Fetching comments from URL:", url);

  const res = await authFetch(url);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", errorText);
    throw new Error(`Failed to fetch comments: ${errorText}`);
  }

  const data = await res.json();
  console.log("Comments API response:", data);
  return data;
}
export async function createComment(data: {
  post: number;
  parent?: number;
  content: string;
}): Promise<Comment> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create comment");
  }

  return res.json();
}

export async function updateComment(
  id: number,
  data: Partial<Comment>
): Promise<Comment> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to update comment");
  }

  return res.json();
}

export async function deleteComment(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete comment");
  }
}

export async function pinComment(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/pin/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to pin comment");
  }
}

export async function unpinComment(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/unpin/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to unpin comment");
  }
}

export async function likeComment(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/like/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to like comment");
  }
}

export async function unlikeComment(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/comments/${id}/unlike/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to unlike comment");
  }
}

// Media API functions
export async function fetchMedia(params?: {
  post_id?: number;
  media_type?: "image" | "video";
  page?: number;
  ordering?: string;
}): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: Media[];
}> {
  const queryParams = new URLSearchParams();

  if (params?.post_id) {
    queryParams.append("post", params.post_id.toString());
  }

  if (params?.media_type) {
    queryParams.append("media_type", params.media_type);
  }

  if (params?.page) {
    queryParams.append("page", params.page.toString());
  }

  if (params?.ordering) {
    queryParams.append("ordering", params.ordering);
  }

  const url = `${
    process.env.NEXT_PUBLIC_API_URL
  }/media/?${queryParams.toString()}`;
  const res = await authFetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch media");
  }

  return res.json();
}

export async function createMedia(
  postId: number,
  file: File,
  mediaType: "image" | "video"
): Promise<Media> {
  const formData = new FormData();
  formData.append("post", postId.toString());
  formData.append("file", file);
  formData.append("media_type", mediaType);

  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/media/`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create media");
  }

  return res.json();
}

export async function deleteMedia(id: number): Promise<void> {
  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/media/${id}/`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete media");
  }
}

export async function bulkCreateMedia(
  postId: number,
  files: File[],
  mediaTypes: Array<"image" | "video">
): Promise<Media[]> {
  const formData = new FormData();
  formData.append("post_id", postId.toString());

  files.forEach((file, index) => {
    formData.append("files", file);
  });

  mediaTypes.forEach((type, index) => {
    formData.append("media_types", type);
  });

  const res = await authFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/posts/media/bulk_create/`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Failed to bulk upload media");
  }

  return res.json();
}
