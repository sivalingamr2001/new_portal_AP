import { apiService, ApiException } from "./axiosClient"
import type { DashboardDto } from "./types"

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardDto> => {
    try {
      const response = await apiService.get<DashboardDto>("/dashboard")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_DASHBOARD_FAILED",
          message: "Failed to fetch dashboard data.",
          type: "Failure",
        },
        0
      )
    }
  },
}
