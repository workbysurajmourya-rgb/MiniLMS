import { Course, Instructor } from "@/src/types";
import apiClient from "./client";

// freeapi.app paginated wrapper shape
interface FreeApiPage<T> {
  page: number;
  limit: number;
  totalPages: number;
  previousPage: boolean;
  nextPage: boolean;
  totalItems: number;
  currentPageItems: number;
  data: T[];
}

interface FreeApiResponse<T> {
  statusCode: number;
  data: FreeApiPage<T>;
  message: string;
  success: boolean;
}

interface ProductItem {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

interface UserItem {
  id: number;
  gender: string;
  name: { title: string; first: string; last: string };
  email: string;
  phone: string;
  cell: string;
  picture: { large: string; medium: string; thumbnail: string };
  nat: string;
}

// Deterministic rating from product id so it doesn't change on re-renders
function stableRating(id: number): number {
  return parseFloat(((id % 50) / 10 + 1).toFixed(1));
}

function stableEnrolled(id: number): number {
  return (id * 37) % 500;
}

class CourseService {
  /**
   * Fetch courses from random products endpoint (freeapi.app)
   * Response shape: { statusCode, data: { data: Product[], nextPage, ... }, ... }
   */
  async fetchCourses(
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: Course[]; hasMore: boolean }> {
    const response = await apiClient.get<FreeApiResponse<ProductItem>>(
      `/api/v1/public/randomproducts?page=${page}&limit=${limit}`
    );

    const pageData = response.data.data;
    const products = pageData.data ?? [];

    const courses: Course[] = products.map((product) => ({
      id: String(product.id),
      title: product.title || "Untitled Course",
      description: product.description || "No description available.",
      thumbnail: product.thumbnail || "",
      images: product.images ?? [],
      price: product.price || 0,
      instructorId: String((product.id % 10) + 1),
      enrolledCount: stableEnrolled(product.id),
      rating: product.rating ?? stableRating(product.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      content: `Category: ${product.brand ?? ""} · ${product.category ?? ""}`,
    }));

    return { courses, hasMore: pageData.nextPage };
  }

  /**
   * Fetch instructors from random users endpoint (freeapi.app)
   */
  async fetchInstructors(page: number = 1, limit: number = 10): Promise<Instructor[]> {
    const response = await apiClient.get<FreeApiResponse<UserItem>>(
      `/api/v1/public/randomusers?page=${page}&limit=${limit}`
    );

    const users = response.data.data.data ?? [];

    return users.map((user) => ({
      id: String(user.id),
      firstName: user.name?.first || "Unknown",
      lastName: user.name?.last || "Instructor",
      email: user.email || `instructor${user.id}@example.com`,
      phone: user.phone || "",
      image: user.picture?.large || "",
    }));
  }

  /**
   * Fetch courses with instructors merged in
   */
  async fetchCoursesWithInstructors(
    page: number = 1,
    limit: number = 10
  ): Promise<{ courses: Course[]; hasMore: boolean }> {
    const [{ courses, hasMore }, instructors] = await Promise.all([
      this.fetchCourses(page, limit),
      this.fetchInstructors(1, 10),
    ]);

    const merged = courses.map((course) => {
      const instructor = instructors.find((i) => i.id === course.instructorId);
      return instructor ? { ...course, instructor } : course;
    });

    return { courses: merged, hasMore };
  }

  /**
   * Fetch a single course by stable numeric id (fetches all and finds matching)
   */
  async fetchCourseDetails(courseId: string): Promise<Course> {
    // Products API is paginated; id ≤ 100 means page = ceil(id / limit)
    const id = parseInt(courseId, 10);
    if (!isNaN(id)) {
      const page = Math.ceil(id / 10) || 1;
      const { courses } = await this.fetchCoursesWithInstructors(page, 10);
      const found = courses.find((c) => c.id === courseId);
      if (found) return found;
    }
    // Fallback: scan page 1
    const { courses } = await this.fetchCoursesWithInstructors(1, 10);
    const fallback = courses.find((c) => c.id === courseId);
    if (fallback) return fallback;
    throw new Error("Course not found");
  }

  /**
   * Search courses by keyword (client-side filter over up to 3 pages)
   */
  async searchCourses(query: string, limit: number = 20): Promise<Course[]> {
    const pagesNeeded = Math.ceil(limit / 10);
    const fetches = Array.from({ length: pagesNeeded }, (_, i) =>
      this.fetchCoursesWithInstructors(i + 1, 10)
    );
    const results = await Promise.all(fetches);
    const all = results.flatMap((r) => r.courses);

    const lowerQuery = query.toLowerCase();
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        (c.content ?? "").toLowerCase().includes(lowerQuery)
    );
  }
}

export default new CourseService();
