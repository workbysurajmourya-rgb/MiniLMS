/**
 * Validation Utilities
 * Schema validation using Zod
 */

import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .min(1, "Password is required"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});

// Type exports for use with react-hook-form
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;

/**
 * Validate data against schema
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data) as T;
};

/**
 * Safely validate data
 */
export const safeValidate = <T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((error: z.ZodIssue) => {
    const path = error.path.join(".");
    errors[path] = error.message;
  });

  return { success: false, errors };
};
