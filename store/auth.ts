// authStore.ts
import { create } from "zustand";
import { User } from "@/types/auth";
import { getCurrentUser } from "@/lib/auth";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    const user = await getCurrentUser();
    set({ user });
  },
}));
