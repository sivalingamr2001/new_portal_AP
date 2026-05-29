import {
  apiService,
  type PaginationParams,
} from "@/api/axiosClient"
import type {
  ApiLoginResponseDto,
  Result,
  PagedResult,
} from "@/api/types"

export interface UpdateUserRequest {
  role?: string
  location?: string
}

const userApi = {
  getAll: async (
    params?: PaginationParams
  ): Promise<
    Result<PagedResult<ApiLoginResponseDto>>
  > => {
    const { data } = await apiService.get<
      Result<PagedResult<ApiLoginResponseDto>>
    >("/user", {
      params: {
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      },
    })
    return data
  },

  getById: async (userId: number): Promise<Result<ApiLoginResponseDto>> => {
    const { data } = await apiService.get<Result<ApiLoginResponseDto>>(
      `/user/${userId}`
    )
    return data
  },

  update: async (userId: number, payload: UpdateUserRequest) => {
    const { data } = await apiService.put<Result<ApiLoginResponseDto>>(
      `/user/${userId}`,
      payload
    )
    return data
  },
}

export default userApi
