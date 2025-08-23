'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, UserX, Clock, Loader2 } from 'lucide-react';

const ConnectionButton = ({ targetUserId, className }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (targetUserId) {
            fetchConnectionStatus();
        }
    }, [targetUserId]);

    const fetchConnectionStatus = async () => {
        try {
            const response = await apiFetch(`/api/connections/status/${targetUserId}`);

            if (!response.ok) throw new Error('Failed to fetch connection status');

            const statusText = await response.text();
            setStatus(statusText === 'NONE' ? null : statusText);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const sendFriendRequest = async () => {
        setActionLoading(true);
        try {
            const response = await apiFetch('/api/connections/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId: targetUserId }),
            });

            if (!response.ok) throw new Error('Failed to send friend request');

            setStatus('PENDING');
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const acceptRequest = async () => {
        setActionLoading(true);
        try {
            // First, we need to get the connection ID for the pending request
            const pendingResponse = await apiFetch('/api/connections/pending/received');

            if (!pendingResponse.ok) throw new Error('Failed to fetch pending requests');

            const pendingRequests = await pendingResponse.json();
            const connection = pendingRequests.find(req => req.requesterId === targetUserId || req.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await apiFetch(`/api/connections/${connection.id}/accept`, { method: 'PUT' });

            if (!response.ok) throw new Error('Failed to accept friend request');

            setStatus('ACCEPTED');
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const rejectRequest = async () => {
        setActionLoading(true);
        try {
            // First, we need to get the connection ID for the pending request
            const pendingResponse = await apiFetch('/api/connections/pending/received');

            if (!pendingResponse.ok) throw new Error('Failed to fetch pending requests');

            const pendingRequests = await pendingResponse.json();
            const connection = pendingRequests.find(req => req.requesterId === targetUserId || req.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await apiFetch(`/api/connections/${connection.id}/reject`, { method: 'PUT' });

            if (!response.ok) throw new Error('Failed to reject friend request');

            setStatus('REJECTED');
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const removeConnection = async () => {
        setActionLoading(true);
        try {
            // First, we need to get the connection ID
            const connectionsResponse = await apiFetch('/api/connections/my');

            if (!connectionsResponse.ok) throw new Error('Failed to fetch connections');

            const connections = await connectionsResponse.json();
            const connection = connections.find(conn => conn.requesterId === targetUserId || conn.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await apiFetch(`/api/connections/${connection.id}`, { method: 'DELETE' });

            if (!response.ok) throw new Error('Failed to remove connection');

            setStatus(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <Button variant="outline" disabled className={`bg-gray-100 text-gray-600 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
            </Button>
        );
    }

    if (error) {
        return (
            <Button variant="outline" disabled className={`bg-red-100 text-red-700 border-red-200 ${className}`}>
                Error: {error}
            </Button>
        );
    }

    // Render different button states based on connection status
    switch (status) {
        case 'PENDING':
            return (
                <Button variant="outline" disabled className={`bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 ${className}`}>
                    <Clock className="h-4 w-4 mr-2" />
                    Request Sent
                </Button>
            );

        case 'ACCEPTED':
            return (
                <Button 
                    variant="outline" 
                    onClick={removeConnection}
                    disabled={actionLoading}
                    className={`bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200 hover:text-sky-900 ${className}`}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    {actionLoading ? 'Removing...' : 'Connected'}
                </Button>
            );

        case 'REJECTED':
            return (
                <Button 
                    variant="default" 
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className={`bg-gradient-to-r from-sky-300 to-sky-400 text-white hover:from-sky-400 hover:to-sky-500 ${className}`}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {actionLoading ? 'Sending...' : 'Add Friend'}
                </Button>
            );

        case 'BLOCKED':
            return (
                <Button variant="outline" disabled className={`bg-gray-100 text-gray-600 border-gray-200 ${className}`}>
                    <UserX className="h-4 w-4 mr-2" />
                    Blocked
                </Button>
            );

        default:
            // No connection exists - check if there's a pending request from this user
            return (
                <Button 
                    variant="default" 
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className={`bg-gradient-to-r from-sky-300 to-sky-400 text-white hover:from-sky-400 hover:to-sky-500 ${className}`}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {actionLoading ? 'Sending...' : 'Add Friend'}
                </Button>
            );
    }
};

export default ConnectionButton;