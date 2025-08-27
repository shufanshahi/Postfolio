'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Loader2, Users, ExternalLink } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const PendingRequests = ({ className }) => {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await apiFetch('/api/connections/pending/received');

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
            const response = await apiFetch(`/api/connections/${connectionId}/accept`, {
                method: 'PUT',
            });

            if (!response.ok) throw new Error('Failed to accept friend request');

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
            const response = await apiFetch(`/api/connections/${connectionId}/reject`, {
                method: 'PUT',
            });

            if (!response.ok) throw new Error('Failed to reject friend request');

            setPendingRequests(prev => prev.filter(req => req.id !== connectionId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const handleUserClick = (profileId) => {
        if (profileId) {
            router.push(`/user/${profileId}`);
        }
    };

    if (loading) {
        return (
            <Card className={`bg-white border-gray-200 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Users className="h-5 w-5 text-purple-500" />
                        Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                        <span className="ml-2 text-gray-600">Loading requests...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`bg-white border-gray-200 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                        <Users className="h-5 w-5 text-purple-500" />
                        Pending Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-600 text-center py-4">
                        Error: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-white border-gray-200 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Users className="h-5 w-5 text-purple-500" />
                    Pending Requests
                    <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                        {pendingRequests.length}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-gray-600">
                    Connection requests waiting for your response
                </CardDescription>
            </CardHeader>
            <CardContent>
                {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending requests</p>
                        <p className="text-sm text-gray-400">When someone sends you a request, it will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-sky-300 transition-colors duration-200"
                                onClick={() => handleUserClick(request.requesterProfileId)}
                            >
                                <div className="flex items-center gap-3 flex-1 cursor-pointer">
                                    <Avatar className="h-10 w-10">
                                        {request.requesterPictureBase64 ? (
                                            <AvatarImage src={`data:image/jpeg;base64,${request.requesterPictureBase64}`} />
                                        ) : (
                                            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white">
                                                {request.requesterName?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{request.requesterName || 'Unknown User'}</h4>
                                        <p className="text-sm text-gray-600">{request.requesterEmail}</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAccept(request.id);
                                        }}
                                        disabled={actionLoading[request.id]}
                                        size="sm"
                                        className="bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700"
                                    >
                                        {actionLoading[request.id] ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <UserCheck className="h-4 w-4 mr-2" />
                                        )}
                                        Accept
                                    </Button>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReject(request.id);
                                        }}
                                        disabled={actionLoading[request.id]}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                                    >
                                        {actionLoading[request.id] ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <UserX className="h-4 w-4 mr-2" />
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