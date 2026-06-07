import { apiService, ApiException } from "./axiosClient"
import type {
  DepartmentSearchParams,
  DepartmentDetailResponse,
  UpdateDepartmentRequest,
  PaginatedListDto,
} from "./types"

/**
 * NOTE: The backend controller class is named "DepartmentContoller" (typo),
 * so the runtime route is /api/departmentcontoller.
 * Update this constant to /api/department once the controller is renamed on the server.
 */
const DEPT_BASE = "/departmentcontoller"

export const departmentsApi = {
  /**
   * GET /api/departmentcontoller
   * Paginated department list with optional search and HOD filter.
   */
  getDepartments: async (
    params?: DepartmentSearchParams
  ): Promise<PaginatedListDto<DepartmentDetailResponse>> => {
    try {
      const response = await apiService.get<PaginatedListDto<DepartmentDetailResponse>>(
        DEPT_BASE,
        { params }
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_DEPARTMENTS_FAILED", message: "Failed to fetch departments.", type: "Failure" },
        0
      )
    }
  },

  /**
   * GET /api/departmentcontoller/{departmentId}
   */
  getDepartment: async (departmentId: number): Promise<DepartmentDetailResponse> => {
    try {
      const response = await apiService.get<DepartmentDetailResponse>(
        `${DEPT_BASE}/${departmentId}`
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_DEPARTMENT_FAILED",
          message: `Failed to fetch department ${departmentId}.`,
          type: "Failure",
        },
        0
      )
    }
  },

  /**
   * PUT /api/departmentcontoller
   * Updates a department's name and/or HOD.
   */
  updateDepartment: async (
    dto: UpdateDepartmentRequest
  ): Promise<DepartmentDetailResponse> => {
    try {
      const response = await apiService.put<DepartmentDetailResponse>(DEPT_BASE, dto)
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "UPDATE_DEPARTMENT_FAILED",
          message: `Failed to update department ${dto.departmentId}.`,
          type: "Failure",
        },
        0
      )
    }
  },
}
