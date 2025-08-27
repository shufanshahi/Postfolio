import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://localhost:8080';

export const useMessagePolling = (userEmail, pollingInterval = 3000) => {
    const [isPolling, setIsPolling] = useState(false);
    const intervalRef = useRef(null);
    const lastMessageTimestampRef = useRef(null);

    const getAuthToken = () => localStorage.getItem('token');

    const checkForNewMessages = useCallback(async (conversationId) => {
        if (!userEmail || !conversationId) return [];

        try {
            const token = getAuthToken();
            if (!token) return [];

            // Get messages from the conversation
            const response = await fetch(
                `${API_BASE_URL}/api/messages/conversation/${conversationId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const messages = await response.json();
                return messages;
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
        return [];
    }, [userEmail]);

    const checkForNewConversations = useCallback(async () => {
        if (!userEmail) return [];

        try {
            const token = getAuthToken();
            if (!token) return [];

            const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const conversations = await response.json();
                return conversations;
            }
        } catch (error) {
            console.error('Error checking for new conversations:', error);
        }
        return [];
    }, [userEmail]);

    const startPolling = useCallback(() => {
        if (intervalRef.current || !userEmail) return;

        setIsPolling(true);
        console.log('Starting message polling...');

        intervalRef.current = setInterval(() => {
            // This will trigger re-fetching in the component that uses this hook
            console.log('Polling for new messages...');
        }, pollingInterval);
    }, [userEmail, pollingInterval]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsPolling(false);
            console.log('Stopped message polling');
        }
    }, []);

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    return {
        isPolling,
        startPolling,
        stopPolling,
        checkForNewMessages,
        checkForNewConversations
    };
};
