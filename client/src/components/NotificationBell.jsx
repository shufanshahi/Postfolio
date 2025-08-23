'use client';
import { useState } from 'react';
import { Bell, Check, CheckCheck, Clock, UserPlus, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificationContext } from '@/contexts/NotificationContext';

const getNotificationIcon = (type) => {
    switch (type) {
        case 'CONNECTION_REQUEST':
            return <UserPlus className="h-4 w-4 text-blue-600" />;
        case 'CONNECTION_ACCEPTED':
            return <UserPlus className="h-4 w-4 text-green-600" />;
        case 'POST_LIKED':
            return <Heart className="h-4 w-4 text-red-600" />;
        case 'POST_COMMENTED':
            return <MessageSquare className="h-4 w-4 text-purple-600" />;
        default:
            return <Bell className="h-4 w-4 text-gray-600" />;
    }
};

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
};

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Navigate to relevant page if actionUrl exists
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                    <CheckCheck className="h-4 w-4 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${notification.isRead
                                                ? 'border-l-transparent bg-white'
                                                : 'border-l-blue-500 bg-blue-50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-600 mb-1">
                                                    {notification.message}
                                                </p>

                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatTimeAgo(notification.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {notifications.length > 10 && (
                                    <div className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.location.href = '/notifications'}
                                        >
                                            View all notifications
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
