// lib/auth.ts

import { PaginatedResponse, School, User } from "@/types/auth";

export const hasSchoolDashboardAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.user_type === "school" || user.user_type === "school_staff";
};

export const hasAdminDashboardAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_superuser;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const defaultHeaders: HeadersInit = {};

  if (!(options.body instanceof FormData) && options.body) {
    if (
      !options.headers ||
      !(options.headers as Record<string, string>)["Content-Type"]
    ) {
      defaultHeaders["Content-Type"] = "application/json";
    }
  }

  const mergedOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  return fetch(url, mergedOptions);
}

export const login = async (
  username: string,
  password: string
): Promise<User> => {
  const res = await apiFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/jwt/create/`,
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  }

  // The backend has set the HttpOnly cookies. Now get user data.
  const user = await getAuthenticatedUser();

  if (
    !user ||
    (!hasSchoolDashboardAccess(user) && !hasAdminDashboardAccess(user))
  ) {
    await logout();
    throw new Error("You do not have permission to access this application.");
  }

  return user;
};

export const logout = async (): Promise<boolean> => {
  try {
    const res = await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/logout/`,
      {
        method: "POST",
      }
    );

    if (!res.ok) {
      console.warn("Backend logout failed, proceeding with frontend logout.");
    }

    // Clear cookies on the client side
    document.cookie = "access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    // Even if there's an error, try to clear cookies
    document.cookie = "access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    return false;
  }
};

// FIXED: Simple getCurrentUser that doesn't auto-refresh to prevent loops
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/auth/users/me/`
    );

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      console.error(`Failed to fetch current user. Status: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};

// This function is for checking auth state on page load - no auto-refresh
export const getAuthenticatedUser = async (): Promise<User | null> => {
  return await getCurrentUser();
};

let refreshPromise: Promise<boolean> | null = null;

export const refreshToken = async (): Promise<boolean> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = apiFetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/jwt/refresh/`,
    {
      method: "POST",
    }
  )
    .then(async (response) => {
      refreshPromise = null;
      if (!response.ok) {
        throw new AuthError("Failed to refresh token");
      }
      return true;
    })
    .catch((error) => {
      refreshPromise = null;
      throw error;
    });

  return refreshPromise;
};

// FIXED: Only use authFetch for API calls that should auto-refresh
// Don't use this for initial auth checks
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  let response = await apiFetch(url, options);

  if (response.status === 401) {
    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        response = await apiFetch(url, options);
      }
    } catch (error) {
      // If refresh fails, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new AuthError("Authentication failed, redirecting to login.");
    }
  }

  return response;
};

export async function fetchSchool(): Promise<School> {
  const res = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/`);
  if (!res.ok) {
    throw new Error("Failed to fetch school");
  }
  const data: PaginatedResponse<School> = await res.json();
  return data.results[0];
}
