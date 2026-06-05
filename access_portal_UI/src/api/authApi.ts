import { apiService, ApiException } from "./axiosClient"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginValues {
  identifier: string
  password: string
}

export interface UserProfile {
  id: number
  name: string | null
  role: string
  location: string
  employeeId: string | null
  email: string | null
  mobileNumber: number | null
  departmentId: number | null
}

export interface DepartmentDto {
  id: number
  name: string | null
  hodId: string | null
}

export interface HodDto {
  id: number
  name: string | null
  employeeId: string | null
  email: string | null
  mobileNumber: string | null
}

export interface LoginResponse {
  user: UserProfile | null
  department: DepartmentDto | null
  headOfDepartment: HodDto | null
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Authenticates a user with identifier + password.
   * Returns user profile, department, and HOD details on success.
   */
  login: async (values: LoginValues): Promise<LoginResponse> => {
    try {
      const response = await apiService.post<LoginResponse>("/Auth/login", values)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "LOGIN_FAILED", message: "Login request failed unexpectedly.", type: "Failure" },
        0
      )
    }
  },

  /**
   * Logs out the currently authenticated user and clears the server session.
   */
  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await apiService.post<{ message: string }>("/Auth/logout")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "LOGOUT_FAILED", message: "Logout request failed unexpectedly.", type: "Failure" },
        0
      )
    }
  },
}
