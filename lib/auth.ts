import { PaginatedResponse, School, User } from "@/types/auth";

// update your auth type helpers

export const hasDashboardAccess = (user: User | null): boolean => {
  if (!user) return false;
  // now allow school_staff accounts too
  return (
    user.is_superuser ||
    user.user_type === "school" ||
    user.user_type === "school_staff"
  );
};

export const canEditDashboard = (user: User | null): boolean => {
  if (!user) return false;
  if (user.is_superuser || user.user_type === "school") return true;
  if (user.user_type === "school_staff") {
    return (
      user.staff_profile.permission_level === "edit" ||
      user.staff_profile.permission_level === "admin"
    );
  }
  return false;
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
  const defaultHeaders: HeadersInit = {
    // 'Accept': 'application/json', // Good to specify what you expect in response
  };

  // Conditionally set Content-Type
  // If options.body is FormData, let the browser set the Content-Type.
  // Otherwise, default to application/json if a body exists and Content-Type isn't already set.
  if (!(options.body instanceof FormData) && options.body) {
    if (
      !options.headers ||
      !(options.headers as Record<string, string>)["Content-Type"]
    ) {
      defaultHeaders["Content-Type"] = "application/json";
    }
  }

  const mergedOptions: RequestInit = {
    ...options, // Spread incoming options first
    credentials: options.credentials || "include", // Sensible default, allow override
    headers: {
      ...defaultHeaders, // Your conditional default headers
      ...(options.headers || {}), // Then spread headers from incoming options
    },
  };

  return fetch(url, mergedOptions);
}

export const login = async (
  username: string,
  password: string
): Promise<boolean> => {
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

  // Check user type after successful login
  const user = await getCurrentUser();
  if (!hasDashboardAccess(user)) {
    // Optionally clear tokens on the backend here
    await logout();
    throw new Error("You do not have permission to access the dashboard");
  }

  return true;
};

/**
 * Logout function: Calls the API to end the session.
 */
export const logout = async (): Promise<boolean> => {
  try {
    const res = await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/logout/`,
      {
        method: "POST",
      }
    );

    if (!res.ok) {
      throw new Error("Logout failed");
    }

    document.cookie =
      "access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None";
    document.cookie =
      "refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None";

    return true;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const res = await apiFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/auth/users/me/`
    );
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
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
        // Clear cookies on refresh failure
        document.cookie =
          "access=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None";
        document.cookie =
          "refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=None";
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

export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  // First attempt
  let response = await apiFetch(url, options);

  // If unauthorized, try to refresh the token and retry
  if (response.status === 401) {
    try {
      const refreshed = await refreshToken();
      if (refreshed) {
        response = await apiFetch(url, options);
      }
    } catch (error) {
      throw new AuthError("Authentication failed");
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
