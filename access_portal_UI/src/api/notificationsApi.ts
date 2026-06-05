import { apiService, ApiException } from "./axiosClient"
import type { NotificationDto } from "./types"

export const notificationsApi = {
  getNotifications: async (unreadOnly = false): Promise<NotificationDto[]> => {
    try {
      const response = await apiService.get<NotificationDto[]>("/notifications", {
        params: { unreadOnly },
      })
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_NOTIFICATIONS_FAILED", message: "Failed to fetch notifications.", type: "Failure" },
        0
      )
    }
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    try {
      const response = await apiService.get<{ count: number }>("/notifications/unread-count")
      return response.data
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "FETCH_UNREAD_COUNT_FAILED", message: "Failed to fetch unread notification count.", type: "Failure" },
        0
      )
    }
  },

  markRead: async (id: number): Promise<void> => {
    try {
      await apiService.patch<void>(`/notifications/${id}/mark-read`)
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "MARK_READ_FAILED", message: `Failed to mark notification ${id} as read.`, type: "Failure" },
        0
      )
    }
  },

  markAllRead: async (): Promise<void> => {
    try {
      await apiService.patch<void>("/notifications/mark-all-read")
    } catch (error) {
      if (error instanceof ApiException) throw error
      throw new ApiException(
        { code: "MARK_ALL_READ_FAILED", message: "Failed to mark all notifications as read.", type: "Failure" },
        0
      )
    }
  },
}
