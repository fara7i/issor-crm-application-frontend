import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api-client";

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SHOP_AGENT' | 'WAREHOUSE_AGENT' | 'CONFIRMER';

interface User {
  id: number;
  phone: string;
  name: string | null;
  role: UserRole;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  loginWithRole: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

// Demo credentials mapping
const DEMO_CREDENTIALS: Record<UserRole, { phone: string; password: string }> = {
  SUPER_ADMIN: { phone: '0600000001', password: 'Admin123!' },
  ADMIN: { phone: '0600000002', password: 'Admin123!' },
  SHOP_AGENT: { phone: '0600000003', password: 'Shop123!' },
  WAREHOUSE_AGENT: { phone: '0600000004', password: 'Warehouse123!' },
  CONFIRMER: { phone: '0600000005', password: 'Confirm123!' },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (phone: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.login(phone, password);

          // Store token in localStorage for API client to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.token);
          }

          set({
            user: response.user as User,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      loginWithRole: async (role: UserRole) => {
        const credentials = DEMO_CREDENTIALS[role];
        if (credentials) {
          await get().login(credentials.phone, credentials.password);
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      logout: async () => {
        // Call logout API to clear the HTTP-only cookie
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          console.error('Logout API error:', error);
        }

        // Remove token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await authAPI.getMe();
          set({
            user: response.user as User,
            isAuthenticated: true,
          });
        } catch {
          // Token invalid or expired
          get().logout();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore token to localStorage on rehydration
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', state.token);
        }
      },
    }
  )
);
