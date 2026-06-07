import { apiService, ApiException } from "./axiosClient"
import type { LoginRequestDto, AuthSessionResponseDto } from "./types"

export const authApi = {
  /**
   * POST /api/auth/login
   * Public endpoint — no X-User-Id header required.
   * Returns AuthSessionResponseDto on success.
   */
  login: async (dto: LoginRequestDto): Promise<AuthSessionResponseDto> => {
    try {
      const response = await apiService.post<AuthSessionResponseDto>(
        "/auth/login",
        dto
      )
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "LOGIN_FAILED",
          message: "Login request failed unexpectedly.",
          type: "Failure",
        },
        0
      )
    }
  },
}
