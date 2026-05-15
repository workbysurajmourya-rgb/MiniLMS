import authService from "@/src/api/auth";
import { AuthState, User } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });

          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              error: response.message || "Login failed",
              isLoading: false,
            });
          }
        } catch (error) {
          const errorMessage =
            (error as { message?: string })?.message || "Login failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (
        email: string,
        password: string,
        firstName?: string,
        lastName?: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register({
            email,
            password,
            firstName,
            lastName,
          });

          if (response.success) {
            set({
              user: response.data.user,
              token: response.data.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              error: response.message || "Registration failed",
              isLoading: false,
            });
          }
        } catch (error) {
          const errorMessage =
            (error as { message?: string })?.message || "Registration failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Logout failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      restoreSession: async () => {
        set({ isLoading: true });
        try {
          const { user, token } = await authService.restoreSession();
          set({
            user,
            token,
            isAuthenticated: !!token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
