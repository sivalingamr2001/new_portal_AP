import type {
  UserSearchParams,
  PaginatedListDto,
  UserProfileResponseDto,
  HodUserDto,
} from "./types"
import {
  mockUsers,
  mockHods,
  createPaginatedResponse,
  filterBySearchTerm,
} from "./mockData"

export const usersApi = {
  /**
   * GET /api/users (MOCK)
   * Returns paginated list of mock users with optional search filtering.
   */
  getUsers: async (
    params?: UserSearchParams
  ): Promise<PaginatedListDto<UserProfileResponseDto>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    let filtered = mockUsers
    if (params?.searchTerm) {
      filtered = filterBySearchTerm(filtered, params.searchTerm, [
        "userName",
        "mailId",
        "empId",
      ])
    }
    
    return createPaginatedResponse(
      filtered,
      params?.pageNumber || 1,
      params?.pageSize || 20
    )
  },

  /**
   * GET /api/users/id/{userId} (MOCK)
   */
  getUserById: async (userId: number): Promise<UserProfileResponseDto> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const user = mockUsers.find((u) => u.userId === userId)
    if (!user) {
      throw new Error(`User ${userId} not found`)
    }
    return user
  },

  /**
   * GET /api/users/email/{email} (MOCK)
   */
  getUserByEmail: async (email: string): Promise<UserProfileResponseDto> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const user = mockUsers.find(
      (u) => u.mailId.toLowerCase() === email.toLowerCase()
    )
    if (!user) {
      throw new Error(`User with email ${email} not found`)
    }
    return user
  },

  /**
   * GET /api/users/empid/{empId} (MOCK)
   */
  getUserByEmpId: async (empId: string): Promise<UserProfileResponseDto> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const user = mockUsers.find((u) => u.empId === empId)
    if (!user) {
      throw new Error(`User with employee ID ${empId} not found`)
    }
    return user
  },

  /**
   * GET /api/users/hods (MOCK)
   * Returns all mock HOD users.
   */
  getHods: async (): Promise<HodUserDto[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockHods
  },

  /**
   * GET /api/users/hod/{departmentId} (MOCK)
   * Returns the HOD for a specific department.
   */
  getHodByDepartment: async (departmentId: number): Promise<HodUserDto> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const hod = mockHods.find((h) => h.departmentId === departmentId)
    if (!hod) {
      throw new Error(`HOD for department ${departmentId} not found`)
    }
    return hod
  },
}
