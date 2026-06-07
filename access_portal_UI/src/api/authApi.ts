import type { LoginRequestDto, AuthSessionResponseDto } from "./types"
import { mockAuthSession } from "./mockData"

export const authApi = {
  /**
   * POST /api/auth/login (MOCK)
   * Returns mock AuthSessionResponseDto for any login credentials.
   */
  login: async (dto: LoginRequestDto): Promise<AuthSessionResponseDto> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    // Return mock session with the provided userName
    return {
      ...mockAuthSession,
      userName: dto.userName,
      authenticatedAtUtc: new Date().toISOString(),
    }
  },
}
