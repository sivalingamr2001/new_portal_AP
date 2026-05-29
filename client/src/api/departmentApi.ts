import { apiService, type PaginationParams } from "@/api/axiosClient"
import type {
  DepartmentResponseDto,
  Result,
  PagedApiResponse,
  PagedResult,
} from "@/api/types"

export interface UpdateDepartmentRequest {
  deptName?: string | null
  hodId?: number | null
}

const departmentApi = {
  getAll: async (
    params?: PaginationParams
  ): Promise<Result<PagedResult<DepartmentResponseDto>>> => {
    const { data } = await apiService.get<
      Result<PagedResult<DepartmentResponseDto>>
    >("/department", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 10,
      },
    })
    return data
  },

  getById: async (deptId: number): Promise<Result<DepartmentResponseDto>> => {
    const { data } = await apiService.get<Result<DepartmentResponseDto>>(
      `/department/${deptId}`
    )
    return data
  },

  update: async (
    deptId: number,
    payload: UpdateDepartmentRequest
  ): Promise<Result<DepartmentResponseDto>> => {
    const { data } = await apiService.put<Result<DepartmentResponseDto>>(
      `/department/${deptId}`,
      payload
    )
    return data
  },
}

export default departmentApi
