import { apiService, ApiException } from "./axiosClient"
import type {
  UserSearchParams,
  PaginatedListDto,
  UserProfileResponseDto,
  HodUserDto,
} from "./types"

export const usersApi = {
  /**
   * GET /api/users
   * Paginated list of all portal users with optional search / role / location filters.
   */
  getUsers: async (
    params?: UserSearchParams
  ): Promise<PaginatedListDto<UserProfileResponseDto>> => {
    try {
      const response = await apiService.get<PaginatedListDto<UserProfileResponseDto>>(
        "/users",
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_USERS_FAILED", message: "Failed to fetch users.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/users/id/{userId}
   */
  getUserById: async (userId: number): Promise<UserProfileResponseDto> => {
    try {
      const response = await apiService.get<UserProfileResponseDto>(`/users/id/${userId}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_USER_FAILED", message: `Failed to fetch user ${userId}.`, type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/users/email/{email}
   */
  getUserByEmail: async (email: string): Promise<UserProfileResponseDto> => {
    try {
      const response = await apiService.get<UserProfileResponseDto>(
        `/users/email/${encodeURIComponent(email)}`
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_USER_BY_EMAIL_FAILED", message: `Failed to fetch user by email.`, type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/users/empid/{empId}
   */
  getUserByEmpId: async (empId: string): Promise<UserProfileResponseDto> => {
    try {
      const response = await apiService.get<UserProfileResponseDto>(`/users/empid/${empId}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_USER_BY_EMPID_FAILED", message: `Failed to fetch user by employee ID.`, type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/users/hods
   * Returns all HOD users.
   */
  getHods: async (): Promise<HodUserDto[]> => {
    try {
      const response = await apiService.get<HodUserDto[]>("/users/hods")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_HODS_FAILED", message: "Failed to fetch HODs.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/users/hod/{departmentId}
   * Returns the HOD for a specific department.
   */
  getHodByDepartment: async (departmentId: number): Promise<HodUserDto> => {
    try {
      const response = await apiService.get<HodUserDto>(`/users/hod/${departmentId}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_HOD_FAILED",
          message: `Failed to fetch HOD for department ${departmentId}.`,
          type: "Failure",
        },
        0
      )
    }
  },
}
