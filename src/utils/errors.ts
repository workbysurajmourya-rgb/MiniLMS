/**
 * Error Handling Utilities
 * Global error handler and error boundary utilities
 */

import { ApiError } from "@/src/types";
import axios from "axios";

class ErrorHandler {
  /**
   * Handle API errors
   */
  static handleApiError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const data = error.response?.data as Record<string, unknown>;

      return {
        message: (data?.message as string) || error.message || "An error occurred",
        statusCode: status,
        code: (data?.code as string) || "UNKNOWN",
        details: data,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        statusCode: 0,
        code: "ERROR",
      };
    }

    return {
      message: "An unexpected error occurred",
      statusCode: 0,
      code: "UNKNOWN",
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ApiError | unknown): string {
    if (error instanceof Object && "message" in error) {
      const apiError = error as ApiError;

      switch (apiError.code) {
        case "NETWORK_ERROR":
        case "NO_RESPONSE":
          return "Network error. Please check your connection.";

        case "TIMEOUT":
          return "Request timed out. Please try again.";

        case "INVALID_CREDENTIALS":
          return "Invalid email or password.";

        case "EMAIL_EXISTS":
          return "Email already exists. Please use another email.";

        case "UNAUTHORIZED":
          return "Your session has expired. Please login again.";

        case "FORBIDDEN":
          return "You don't have permission to perform this action.";

        case "NOT_FOUND":
          return "The requested resource was not found.";

        case "VALIDATION_ERROR":
          return "Please check your input and try again.";

        case "SERVER_ERROR":
          return "Server error occurred. Please try again later.";

        default:
          return apiError.message || "An error occurred. Please try again.";
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred";
  }

  /**
   * Log error for debugging
   */
  static logError(error: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : "";

    if (error instanceof Error) {
      console.error(
        `${prefix} [${timestamp}] Error:`,
        error.message,
        error.stack
      );
    } else {
      console.error(`${prefix} [${timestamp}] Error:`, error);
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = [
      "NETWORK_ERROR",
      "TIMEOUT",
      "ECONNABORTED",
      "ECONNREFUSED",
      "ECONNRESET",
    ];

    return (
      retryableStatuses.includes(error.statusCode) ||
      retryableCodes.includes(error.code || "")
    );
  }

  /**
   * Check if error is authentication-related
   */
  static isAuthError(error: ApiError): boolean {
    return (
      error.statusCode === 401 ||
      error.statusCode === 403 ||
      error.code === "UNAUTHORIZED" ||
      error.code === "INVALID_CREDENTIALS"
    );
  }

  /**
   * Format validation errors
   */
  static formatValidationErrors(
    errors: Record<string, string>
  ): Record<string, string> {
    const formatted: Record<string, string> = {};

    Object.entries(errors).forEach(([key, value]) => {
      // Convert nested field names (e.g., "user.email" to "user_email")
      const fieldName = key.replace(/\./g, "_");
      formatted[fieldName] = value;
    });

    return formatted;
  }
}

export default ErrorHandler;
