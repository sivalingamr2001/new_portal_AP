import { apiService, ApiException } from "./axiosClient"
import type { LoginValues, LoginResponse } from "./types"

export const authApi = {
  /**
   * Authenticates a user with identifier + password.
   * Returns user profile, department, and HOD details on success.
   */
  login: async (values: LoginValues): Promise<LoginResponse> => {
    try {
      const response = await apiService.post<LoginResponse>(
        "/Auth/login",
        values
      )
      return response.data
    } catch (error: any) {
      // Use 'any' or your HTTP library error type here
      if (error instanceof ApiException) throw error

      // Extract the real backend message if it exists
      const backendMessage =
        error.response?.data?.message ||
        error.data?.message ||
        "Login request failed unexpectedly."

      throw new ApiException(
        {
          code: "LOGIN_FAILED",
          message: backendMessage, // Put the real message here
          type: "Failure",
        },
        error.response?.status || 0
      )
    }
  },

  /**
   * Logs out the currently authenticated user and clears the server session.
   */
  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await apiService.post<{ message: string }>(
        "/Auth/logout"
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "LOGOUT_FAILED",
          message: "Logout request failed unexpectedly.",
          type: "Failure",
        },
        0
      )
    }
  },
}
