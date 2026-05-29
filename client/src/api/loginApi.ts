import { apiService } from "@/api/axiosClient"
import type { LoginResponse } from "./types"

export const loginApi = {
  login: async (values: {
    identifier: string
    password: string
  }): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>("/Auth/login", values)
    return response.data
  }
}
