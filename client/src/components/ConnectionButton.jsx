'use client';
import { useState, useEffect } from 'react';
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
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/connections/status/${targetUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

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
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/connections/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
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
            const token = localStorage.getItem('token');
            // First, we need to get the connection ID for the pending request
            const pendingResponse = await fetch('http://localhost:8080/api/connections/pending/received', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!pendingResponse.ok) throw new Error('Failed to fetch pending requests');

            const pendingRequests = await pendingResponse.json();
            const connection = pendingRequests.find(req => req.requesterId === targetUserId || req.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await fetch(`http://localhost:8080/api/connections/${connection.id}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

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
            const token = localStorage.getItem('token');
            // First, we need to get the connection ID for the pending request
            const pendingResponse = await fetch('http://localhost:8080/api/connections/pending/received', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!pendingResponse.ok) throw new Error('Failed to fetch pending requests');

            const pendingRequests = await pendingResponse.json();
            const connection = pendingRequests.find(req => req.requesterId === targetUserId || req.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await fetch(`http://localhost:8080/api/connections/${connection.id}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

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
            const token = localStorage.getItem('token');
            // First, we need to get the connection ID
            const connectionsResponse = await fetch('http://localhost:8080/api/connections/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!connectionsResponse.ok) throw new Error('Failed to fetch connections');

            const connections = await connectionsResponse.json();
            const connection = connections.find(conn => conn.requesterId === targetUserId || conn.receiverId === targetUserId);

            if (!connection) throw new Error('Connection not found');

            const response = await fetch(`http://localhost:8080/api/connections/${connection.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

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
            <Button variant="outline" disabled className={className}>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
            </Button>
        );
    }

    if (error) {
        return (
            <Button variant="destructive" disabled className={className}>
                Error: {error}
            </Button>
        );
    }

    // Render different button states based on connection status
    switch (status) {
        case 'PENDING':
            return (
                <Button variant="outline" disabled className={className}>
                    <Clock className="h-4 w-4" />
                    Request Sent
                </Button>
            );

        case 'ACCEPTED':
            return (
                <Button 
                    variant="outline" 
                    onClick={removeConnection}
                    disabled={actionLoading}
                    className={className}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserX className="h-4 w-4" />
                    )}
                    {actionLoading ? 'Removing...' : 'Unfriend'}
                </Button>
            );

        case 'REJECTED':
            return (
                <Button 
                    variant="outline" 
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className={className}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="h-4 w-4" />
                    )}
                    {actionLoading ? 'Sending...' : 'Send Friend Request'}
                </Button>
            );

        case 'BLOCKED':
            return (
                <Button variant="outline" disabled className={className}>
                    <UserX className="h-4 w-4" />
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
                    className={className}
                >
                    {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="h-4 w-4" />
                    )}
                    {actionLoading ? 'Sending...' : 'Add Friend'}
                </Button>
            );
    }
};

export default ConnectionButton; 