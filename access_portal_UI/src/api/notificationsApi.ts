import type { NotificationDto } from "./types"

const mockNotifications: NotificationDto[] = [
  {
    auditId: 1,
    eventType: "Request Submitted",
    message: "Your access request has been submitted successfully.",
    isRead: false,
    createdOn: new Date().toISOString(),
    createdAtUtc: new Date().toISOString(),
  },
  {
    auditId: 2,
    eventType: "Approval Pending",
    message: "A HOD approval is pending for your access request.",
    isRead: true,
    createdOn: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAtUtc: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
]

export const notificationsApi = {
  /**
   * GET /api/notifications (MOCK)
   */
  getNotifications: async (): Promise<NotificationDto[]> => {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockNotifications
  },

  /**
   * POST /api/notifications/{auditId}/mark-read (MOCK)
   */
  markRead: async (auditId: number): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return true
  },
}
