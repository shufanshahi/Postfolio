'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Loader2, Users } from 'lucide-react';

const PendingRequests = ({ className }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/connections/pending/received', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch pending requests');

            const data = await response.json();
            setPendingRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (connectionId) => {
        setActionLoading(prev => ({ ...prev, [connectionId]: true }));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/connections/${connectionId}/accept`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to accept friend request');

            // Remove the accepted request from the list
            setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const handleReject = async (connectionId) => {
        setActionLoading(prev => ({ ...prev, [connectionId]: true }));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/connections/${connectionId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to reject friend request');

            // Remove the rejected request from the list
            setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-500 text-center py-4">
                        Error: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Pending Requests
                    {pendingRequests.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {pendingRequests.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No pending friend requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={`data:image/jpeg;base64,${request.requesterPictureBase64}`} />
                                        <AvatarFallback>
                                            {request.requesterName?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{request.requesterName}</p>
                                        <p className="text-sm text-muted-foreground">{request.requesterEmail}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(request.id)}
                                        disabled={actionLoading[request.id]}
                                        className="gap-1"
                                    >
                                        {actionLoading[request.id] ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <UserCheck className="h-3 w-3" />
                                        )}
                                        Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReject(request.id)}
                                        disabled={actionLoading[request.id]}
                                        className="gap-1"
                                    >
                                        {actionLoading[request.id] ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <UserX className="h-3 w-3" />
                                        )}
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PendingRequests; 