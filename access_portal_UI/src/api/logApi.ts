import { apiService, ApiException } from "./axiosClient"

export const logApi = {
  /**
   * Fetches raw string log telemetry from the backend monitor endpoint
   * @param date Target date string formatted as YYYY-MM-DD
   */
  getLogs: async (date: string): Promise<string> => {
    try {
      // 1. Pass the date as a query parameter string
      // 2. Explicitly type the expected response payload as a string
      const response = await apiService.get<string>(`/Monitoring/logs`, {
        params: { date }
      })
      
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        {
          code: "FETCH_LOGS_FAILED",
          message: "Failed to fetch logs for the requested date.",
          type: "Failure",
        },
        0
      )
    }
  },
}
