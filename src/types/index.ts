/**
 * Core Type Definitions for MiniLMS Application
 * Strict TypeScript strict mode enabled
 */

// User Types
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
  message: string;
  statusCode: number;
  success: boolean;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  images?: string[];
  instructorId: string;
  instructor?: Instructor;
  price?: number;
  rating?: number;
  enrolledCount?: number;
  createdAt: string;
  updatedAt: string;
  content?: string;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  image?: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  progress: number;
  enrolledAt: string;
  completedAt?: string;
}

// Bookmark Types
export interface Bookmark {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  message: string;
  statusCode: number;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// State Types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  bookmarkedCourses: string[];
  enrolledCourses: string[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface AppState {
  isOnline: boolean;
  isDarkMode: boolean;
  searchQuery: string;
  errorMessage: string | null;
  successMessage: string | null;
}

// Notification Types
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;
}

// Network Types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}
