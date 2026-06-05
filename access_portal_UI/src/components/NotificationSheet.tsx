import type { AccessNotificationDto } from "@/api/types"
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Bell, Check, Circle } from "lucide-react"
import React from "react"

interface NotificationSheetProps {
  notifications: AccessNotificationDto[]
  isLoading: boolean
  isError: boolean
  onMarkAsRead: (auditId: number) => Promise<void>
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({
  notifications,
  isLoading,
  isError,
  onMarkAsRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <SheetContent side="right" className="flex h-full w-100 flex-col sm:w-135">
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unreadCount} new
            </span>
          )}
        </SheetTitle>
        <SheetDescription>
          Stay updated with your enterprise automation logs.
        </SheetDescription>
      </SheetHeader>

      {/* Content Area */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-2">
        {isLoading && (
          <div className="animate-pulse py-8 text-center text-sm text-muted-foreground">
            Loading your notifications...
          </div>
        )}

        {isError && (
          <div className="py-8 text-center text-sm text-destructive">
            Failed to load notifications. Please try again.
          </div>
        )}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
            No new notifications at this time.
          </div>
        )}

        {!isLoading &&
          !isError &&
          notifications.map((notification) => (
            <div
              key={notification.auditId}
              onClick={() =>
                !notification.isRead && onMarkAsRead(notification.auditId)
              }
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
                notification.isRead
                  ? "bg-background opacity-70 hover:bg-accent/40"
                  : "border-accent bg-accent/30 hover:bg-accent/60"
              }`}
            >
              <div className="mt-1 shrink-0">
                {notification.isRead ? (
                  <Check className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Circle className="h-4 w-4 animate-pulse fill-primary text-primary" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-sm font-medium ${notification.isRead ? "text-foreground/80" : "text-foreground"}`}
                  >
                    {notification.eventType || "Log Update"}
                  </p>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {notification.createdAtUtc
                      ? new Date(notification.createdAtUtc).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "Recent"}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </p>
              </div>
            </div>
          ))}
      </div>
    </SheetContent>
  )
}
