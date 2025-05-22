export type UserType = "school" | "student" | "school_staff";

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  date_created: string;
  is_admin: boolean;
  user_type: UserType;
  is_superuser: boolean;
  is_staff: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface School {
  id: number;
  name: string;
  name_abrev: string;
  school_id: string;
  city: string;
  email: string;
  phone_number: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
