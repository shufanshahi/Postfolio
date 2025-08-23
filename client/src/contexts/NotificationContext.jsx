'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationContext = createContext();

export function NotificationProvider({ children, userId }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { connectionRequestReceived, connectionAccepted, connectionRejected } = useNotifications();

    useEffect(() => {
        if (userId) {
            console.log('NotificationProvider initialized with userId:', userId);
            fetchNotifications();
            fetchUnreadCount();

            // Poll for new notifications every 30 seconds
            const interval = setInterval(() => {
                fetchNotifications();
                fetchUnreadCount();
            }, 30000);

            return () => clearInterval(interval);
        } else {
            console.log('NotificationProvider: No userId provided');
        }
    }, [userId]);

    const fetchNotifications = async () => {
        try {
            console.log('Fetching notifications for userId:', userId);
            const response = await apiFetch(`/api/notifications/${userId}`);
            console.log('Notifications response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Fetched notifications:', data);

                // Check for new notifications and show toasts
                if (notifications.length > 0) {
                    const newNotifications = data.filter(
                        newNotif => !notifications.some(oldNotif => oldNotif.id === newNotif.id)
                    );

                    newNotifications.forEach(notification => {
                        showNotificationToast(notification);
                    });
                }

                setNotifications(data);
            } else {
                console.error('Failed to fetch notifications, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            console.log('Fetching unread count for userId:', userId);
            const response = await apiFetch(`/api/notifications/${userId}/unread-count`);
            if (response.ok) {
                const data = await response.json();
                console.log('Unread count:', data.count);
                setUnreadCount(data.count);
            } else {
                console.error('Failed to fetch unread count, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const showNotificationToast = (notification) => {
        switch (notification.type) {
            case 'CONNECTION_REQUEST':
                connectionRequestReceived(notification.fromUserName);
                break;
            case 'CONNECTION_ACCEPTED':
                connectionAccepted(notification.fromUserName);
                break;
            case 'CONNECTION_REJECTED':
                connectionRejected(notification.fromUserName);
                break;
            default:
                // Generic notification
                break;
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await apiFetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiFetch(`/api/notifications/${userId}/read-all`, {
                method: 'PUT'
            });

            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            refreshNotifications: fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotificationContext = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationContext must be used within NotificationProvider');
    }
    return context;
};
