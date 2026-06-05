import { apiService, ApiException, type PaginationParams, type PagedResult } from "./axiosClient"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DepartmentDetailDto {
  id: number
  name: string | null
  hodId: string | null
  hodName: string | null
  hodEmail: string | null
  isActive: boolean
  createdOn: string
}

export interface UpsertDepartmentDto {
  name: string
  hodId?: string | null
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const departmentsApi = {
  getDepartments: async (
    params?: PaginationParams & { search?: string }
  ): Promise<PagedResult<DepartmentDetailDto>> => {
    try {
      const response = await apiService.get<PagedResult<DepartmentDetailDto>>("/departments", { params })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_DEPARTMENTS_FAILED", message: "Failed to fetch departments.", type: "Failure" },
        0
      )
    }
  },

  getDepartment: async (id: number): Promise<DepartmentDetailDto> => {
    try {
      const response = await apiService.get<DepartmentDetailDto>(`/departments/${id}`)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_DEPARTMENT_FAILED", message: `Failed to fetch department with id ${id}.`, type: "Failure" },
        0
      )
    }
  },

  updateDepartment: async (id: number, dto: UpsertDepartmentDto): Promise<void> => {
    try {
      await apiService.put<void>(`/departments/${id}`, dto)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "UPDATE_DEPARTMENT_FAILED", message: `Failed to update department with id ${id}.`, type: "Failure" },
        0
      )
    }
  },

  deleteDepartment: async (id: number): Promise<void> => {
    try {
      await apiService.delete<void>(`/departments/${id}`)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "DELETE_DEPARTMENT_FAILED", message: `Failed to delete department with id ${id}.`, type: "Failure" },
        0
      )
    }
  },
}
