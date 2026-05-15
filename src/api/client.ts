import { ApiError } from "@/src/types";
import axios, {
    AxiosError,
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from "axios";

// Environment configuration
const API_BASE_URL = "https://api.freeapi.app";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT = 15000;

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
  __retryDelay?: number;
}

class ApiClient {
  private instance: AxiosInstance;
  private maxRetries: number = MAX_RETRIES;
  private retryDelay: number = RETRY_DELAY;

  constructor(baseURL: string = API_BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      (config: RetryConfig) => {
        config.__retryCount = config.__retryCount || 0;
        config.__retryDelay = config.__retryDelay || this.retryDelay;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RetryConfig;

        if (!config) {
          return Promise.reject(this.formatError(error));
        }

        // Determine if we should retry
        const shouldRetry =
          this.isRetryableError(error) &&
          (config.__retryCount || 0) < this.maxRetries;

        if (shouldRetry) {
          config.__retryCount = (config.__retryCount || 0) + 1;

          // Exponential backoff
          const delay =
            (config.__retryDelay || this.retryDelay) *
            Math.pow(2, (config.__retryCount || 1) - 1);

          await new Promise((resolve) => setTimeout(resolve, delay));

          try {
            return this.instance(config);
          } catch (retryError) {
            return Promise.reject(this.formatError(retryError as AxiosError));
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private isRetryableError(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on 5xx server errors
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }

  private formatError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error status
        return {
          message:
            String((axiosError.response.data as Record<string, unknown>)?.message ||
            axiosError.message ||
            "Server error occurred"),
          statusCode: axiosError.response.status,
          code: (axiosError.response.data as Record<string, unknown>)?.code as string | undefined,
          details: axiosError.response.data as Record<string, unknown>,
        };
      } else if (axiosError.request) {
        // Request made but no response
        return {
          message: axiosError.message || "No response from server",
          statusCode: 0,
          code: "NO_RESPONSE",
        };
      }
    }

    return {
      message: error instanceof Error ? error.message : "Unknown error occurred",
      statusCode: 0,
      code: "UNKNOWN_ERROR",
    };
  }

  // GET request
  async get<T>(url: string, config?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  // POST request
  async post<T>(
    url: string,
    data?: unknown,
    config?: RetryConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  // PUT request
  async put<T>(
    url: string,
    data?: unknown,
    config?: RetryConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  // DELETE request
  async delete<T>(url: string, config?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  // Set authorization token
  setAuthToken(token: string | null): void {
    if (token) {
      this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.instance.defaults.headers.common.Authorization;
    }
  }

  // Get the axios instance
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

export default new ApiClient();
