import type {
  DepartmentSearchParams,
  DepartmentDetailResponse,
  UpdateDepartmentRequest,
  PaginatedListDto,
} from "./types"
import {
  mockDepartments,
  createPaginatedResponse,
  filterBySearchTerm,
} from "./mockData"

export const departmentsApi = {
  /**
   * GET /api/departmentcontoller (MOCK)
   * Returns paginated list of mock departments with optional search filtering.
   */
  getDepartments: async (
    params?: DepartmentSearchParams
  ): Promise<PaginatedListDto<DepartmentDetailResponse>> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    let filtered = mockDepartments
    if (params?.searchTerm) {
      filtered = filterBySearchTerm(filtered, params.searchTerm, [
        "departmentName",
      ])
    }
    
    return createPaginatedResponse(
      filtered,
      params?.pageNumber || 1,
      params?.pageSize || 20
    )
  },

  /**
   * GET /api/departmentcontoller/{departmentId} (MOCK)
   */
  getDepartment: async (departmentId: number): Promise<DepartmentDetailResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    const dept = mockDepartments.find((d) => d.departmentId === departmentId)
    if (!dept) {
      throw new Error(`Department ${departmentId} not found`)
    }
    return dept
  },

  /**
   * PUT /api/departmentcontoller (MOCK)
   * Returns updated department with provided data merged.
   */
  updateDepartment: async (
    dto: UpdateDepartmentRequest
  ): Promise<DepartmentDetailResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const dept = mockDepartments.find((d) => d.departmentId === dto.departmentId)
    if (!dept) {
      throw new Error(`Department ${dto.departmentId} not found`)
    }
    
    // Return updated mock department
    return {
      ...dept,
      departmentName: dto.departmentName || dept.departmentName,
      hodId: dto.hodId || dept.hodId,
    }
  },
}
