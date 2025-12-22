import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "@/types";
import { mockUsers } from "@/lib/mock-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithRole: (role: UserRole) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        // Simulate API call delay (password will be used in production)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Find user by email (mock authentication)
        const user = mockUsers.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (user) {
          set({
            user: { ...user, lastLogin: new Date() },
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      loginWithRole: (role: UserRole) => {
        const user = mockUsers.find((u) => u.role === role);
        if (user) {
          set({
            user: { ...user, lastLogin: new Date() },
            isAuthenticated: true,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
