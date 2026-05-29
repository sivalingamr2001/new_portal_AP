import { apiService } from "@/api/axiosClient"
import type { DepartmentResponseDto } from "@/api/types"

export interface UpdateDepartmentRequest {
  deptName?: string | null
  hodId?: number | null
}

const departmentApi = {
  getAll: async (): Promise<DepartmentResponseDto[]> => {
    const { data } =
      await apiService.get<DepartmentResponseDto[]>("/department")

    return data
  },

  getById: async (deptId: number): Promise<DepartmentResponseDto> => {
    const { data } = await apiService.get<DepartmentResponseDto>(
      `/department/${deptId}`
    )

    return data
  },

  update: async (
    deptId: number,
    payload: UpdateDepartmentRequest
  ): Promise<DepartmentResponseDto> => {
    const { data } = await apiService.put<
      DepartmentResponseDto,
      UpdateDepartmentRequest
    >(`/department/${deptId}`, payload)

    return data
  },
}

export default departmentApi
