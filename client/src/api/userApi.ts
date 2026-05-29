import { apiService } from "@/api/axiosClient"
import type { ApiLoginResponseDto } from "@/api/types"

export interface UpdateUserRequest {
  role?: string
  location?: string
}

const userApi = {
  getAll: async (): Promise<ApiLoginResponseDto[]> => {
    const { data } = await apiService.get<ApiLoginResponseDto[]>("/user")

    return data
  },

  getById: async (userId: number): Promise<ApiLoginResponseDto> => {
    const { data } = await apiService.get<ApiLoginResponseDto>(
      `/user/${userId}`
    )

    return data
  },

  update: async (userId: number, payload: UpdateUserRequest) => {
    const { data } = await apiService.put(`/user/${userId}`, payload)

    return data
  },
}

export default userApi
