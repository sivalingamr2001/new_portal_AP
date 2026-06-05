import { apiService, ApiException } from "./axiosClient"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentRequestDto {
  requestId: number
  userId: number
  status: string
  createdOn: string
  itemCount: number
}

export interface DashboardDto {
  totalRequests: number
  pendingWithHod: number
  pendingWithIt: number
  approvedActive: number
  hodRejected: number
  itRejected: number
  revoked: number
  expired: number
  expiringSoon: number
  myPendingItems: number
  myApprovedItems: number
  myRejectedItems: number
  recentRequests: RecentRequestDto[]
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardDto> => {
    try {
      const response = await apiService.get<DashboardDto>("/dashboard")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_DASHBOARD_FAILED", message: "Failed to fetch dashboard data.", type: "Failure" },
        0
      )
    }
  },
}
