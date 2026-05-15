import { AuthCredentials, AuthResponse, User } from "@/src/types";
import * as SecureStore from "expo-secure-store";
import apiClient from "./client";

const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user_data",
};

class AuthService {
  async register(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/users/register",
      {
        email: credentials.email,
        password: credentials.password,
        firstName: credentials.firstName || "",
        lastName: credentials.lastName || "",
        username: credentials.email.split("@")[0],
      }
    );

    if (response.data.success && response.data.data.accessToken) {
      await this.saveTokens(response.data.data.accessToken);
      await this.saveUser(response.data.data.user);
      apiClient.setAuthToken(response.data.data.accessToken);
    }

    return response.data;
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/api/v1/users/login",
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    if (response.data.success && response.data.data.accessToken) {
      await this.saveTokens(response.data.data.accessToken);
      await this.saveUser(response.data.data.user);
      apiClient.setAuthToken(response.data.data.accessToken);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.clearTokens();
      await this.clearUser();
      apiClient.setAuthToken(null);
    } catch {
      await this.clearTokens();
      await this.clearUser();
      apiClient.setAuthToken(null);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  }

  async restoreSession(): Promise<{ user: User | null; token: string | null }> {
    try {
      const token = await this.getAccessToken();
      const user = await this.getCurrentUser();
      if (token) {
        apiClient.setAuthToken(token);
      }
      return { user, token };
    } catch {
      return { user: null, token: null };
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  // Private helper methods

  private async saveTokens(token: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, token);
  }

  private async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
  }

  private async saveUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER, JSON.stringify(user));
  }

  private async clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.USER);
  }
}

export default new AuthService();
