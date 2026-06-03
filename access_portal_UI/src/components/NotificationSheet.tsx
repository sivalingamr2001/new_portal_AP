import type { AccessNotificationDto } from '@/api/types';
import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Bell, Check, Circle } from 'lucide-react';
import React from 'react';

interface NotificationSheetProps {
    notifications: AccessNotificationDto[];
    isLoading: boolean;
    isError: boolean;
    onMarkAsRead: (auditId: number) => Promise<void>;
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({ 
    notifications, 
    isLoading, 
    isError, 
    onMarkAsRead 
}) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <SheetContent side="right" className="w-100 sm:w-135 flex flex-col h-full">
            <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                    {unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </SheetTitle>
                <SheetDescription>
                    Stay updated with your enterprise automation logs.
                </SheetDescription>
            </SheetHeader>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-2">
                {isLoading && (
                    <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
                        Loading your notifications...
                    </div>
                )}

                {isError && (
                    <div className="text-center py-8 text-sm text-destructive">
                        Failed to load notifications. Please try again.
                    </div>
                )}

                {!isLoading && !isError && notifications.length === 0 && (
                    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                        No new notifications at this time.
                    </div>
                )}

                {!isLoading && !isError && notifications.map((notification) => (
                    <div
                        key={notification.auditId}
                        onClick={() => !notification.isRead && onMarkAsRead(notification.auditId)}
                        className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer group ${
                            notification.isRead
                                ? 'bg-background hover:bg-accent/40 opacity-70'
                                : 'bg-accent/30 border-accent hover:bg-accent/60'
                        }`}
                    >
                        <div className="mt-1 shrink-0">
                            {notification.isRead ? (
                                <Check className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Circle className="h-4 w-4 fill-primary text-primary animate-pulse" />
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-medium ${notification.isRead ? 'text-foreground/80' : 'text-foreground'}`}>
                                    {notification.eventType || "Log Update"}
                                </p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {notification.createdAtUtc 
                                        ? new Date(notification.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : 'Recent'}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </SheetContent>
    );
};
