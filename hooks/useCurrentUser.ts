// hooks/useCurrentUser.ts (or integrate into an existing auth context/hook)
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth"; // Your existing getCurrentUser
import { User } from "@/types/auth";

export function useCurrentUser() {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery<User | null, Error>({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // Cache user data for 5 minutes
    refetchOnWindowFocus: true,
  });

  const getPermissionLevel = (): "read" | "edit" | "admin" | null => {
    if (user?.is_superuser) {
      return "admin"; // Superusers effectively have admin rights everywhere
    }
    if (user?.user_type === "school") {
      return "admin"; // School owners are admins of their school
    }
    if (user?.user_type === "school_staff" && user.staff_profile) {
      return user.staff_profile.permission_level;
    }
    return null;
  };

  const canEdit = (): boolean => {
    const level = getPermissionLevel();
    return level === "edit" || level === "admin";
  };

  const isAdmin = (): boolean => {
    const level = getPermissionLevel();
    return level === "admin";
  };

  return {
    user,
    isLoading,
    isError,
    error,
    permissionLevel: getPermissionLevel(),
    canEdit: canEdit(),
    isAdmin: isAdmin(), // If you need to distinguish between edit and admin
  };
}
