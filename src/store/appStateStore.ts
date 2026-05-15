import { AppState } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AppStateStore extends AppState {
  setIsOnline: (isOnline: boolean) => void;
  setIsDarkMode: (isDarkMode: boolean) => void;
  setSearchQuery: (query: string) => void;
  setErrorMessage: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  toggleDarkMode: () => void;
  clearMessages: () => void;
}

export const useAppStateStore = create<AppStateStore>()(
  persist(
    (set) => ({
      isOnline: true,
      isDarkMode: false,
      searchQuery: "",
      errorMessage: null,
      successMessage: null,

      setIsOnline: (isOnline) => set({ isOnline }),
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setErrorMessage: (message) => set({ errorMessage: message }),
      setSuccessMessage: (message) => set({ successMessage: message }),

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      clearMessages: () =>
        set({
          errorMessage: null,
          successMessage: null,
        }),
    }),
    {
      name: "app-state-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);
