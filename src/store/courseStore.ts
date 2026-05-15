import courseService from "@/src/api/courses";
import { Course, CourseState } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CourseStore extends CourseState {
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleBookmark: (courseId: string) => void;
  toggleEnrollment: (courseId: string) => void;
  fetchCourses: (page?: number, limit?: number) => Promise<void>;
  searchCourses: (query: string) => Promise<void>;
  fetchCourseDetails: (courseId: string) => Promise<void>;
  setPage: (page: number) => void;
  clearError: () => void;
  resetCourses: () => void;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
      courses: [],
      selectedCourse: null,
      bookmarkedCourses: [],
      enrolledCourses: [],
      isLoading: false,
      error: null,
      hasMore: true,
      page: 1,

      setCourses: (courses) => set({ courses }),
      setSelectedCourse: (course) => set({ selectedCourse: course }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setPage: (page) => set({ page }),
      clearError: () => set({ error: null }),

      resetCourses: () =>
        set({
          courses: [],
          selectedCourse: null,
          page: 1,
          hasMore: true,
          error: null,
        }),

      toggleBookmark: (courseId: string) => {
        const state = get();
        const isBookmarked = state.bookmarkedCourses.includes(courseId);

        if (isBookmarked) {
          set({
            bookmarkedCourses: state.bookmarkedCourses.filter(
              (id) => id !== courseId
            ),
          });
        } else {
          set({
            bookmarkedCourses: [...state.bookmarkedCourses, courseId],
          });
        }
      },

      toggleEnrollment: (courseId: string) => {
        const state = get();
        const isEnrolled = state.enrolledCourses.includes(courseId);

        if (isEnrolled) {
          set({
            enrolledCourses: state.enrolledCourses.filter(
              (id) => id !== courseId
            ),
          });
        } else {
          set({
            enrolledCourses: [...state.enrolledCourses, courseId],
          });
        }
      },

      fetchCourses: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
          const { courses, hasMore } = await courseService.fetchCoursesWithInstructors(page, limit);
          const currentCourses = page === 1 ? [] : get().courses;

          set({
            courses: [...currentCourses, ...courses],
            isLoading: false,
            page,
            hasMore,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch courses";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      searchCourses: async (query: string) => {
        if (!query.trim()) {
          get().resetCourses();
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const courses = await courseService.searchCourses(query, 30);
          set({
            courses,
            isLoading: false,
            hasMore: false,
            page: 1,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Search failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      fetchCourseDetails: async (courseId: string) => {
        set({ isLoading: true, error: null });
        try {
          const course = await courseService.fetchCourseDetails(courseId);
          set({
            selectedCourse: course,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch course details";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: "course-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarkedCourses: state.bookmarkedCourses,
        enrolledCourses: state.enrolledCourses,
      }),
    }
  )
);
