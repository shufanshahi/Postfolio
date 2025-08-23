'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserX, Loader2, Users, MessageCircle, ExternalLink } from 'lucide-react';

const ConnectionsList = ({ className }) => {
    const router = useRouter();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [currentUserProfileId, setCurrentUserProfileId] = useState(null);

    useEffect(() => {
        fetchCurrentUserProfile();
    }, []);

    useEffect(() => {
        if (currentUserProfileId !== null) {
            fetchConnections();
        }
    }, [currentUserProfileId]);

    const fetchCurrentUserProfile = async () => {
        try {
            const response = await apiFetch('/api/profile/me');

            if (!response.ok) throw new Error('Failed to fetch current user profile');

            const data = await response.json();
            setCurrentUserProfileId(data.id);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchConnections = async () => {
        try {
            const response = await apiFetch('/api/connections/my');

            if (!response.ok) throw new Error('Failed to fetch connections');

            const data = await response.json();
            setConnections(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveConnection = async (connectionId) => {
        setActionLoading(prev => ({ ...prev, [connectionId]: true }));
        try {
            const response = await apiFetch(`/api/connections/${connectionId}`, { method: 'DELETE' });

            if (!response.ok) throw new Error('Failed to remove connection');

            setConnections(prev => prev.filter(conn => conn.id !== connectionId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const getConnectionUser = (connection) => {
        const isRequesterCurrentUser = connection.requesterProfileId === currentUserProfileId;

        if (isRequesterCurrentUser) {
            return {
                id: connection.receiverProfileId || connection.receiverId,
                name: connection.receiverName,
                email: connection.receiverEmail,
                pictureBase64: connection.receiverPictureBase64
            };
        } else {
            return {
                id: connection.requesterProfileId || connection.requesterId,
                name: connection.requesterName,
                email: connection.requesterEmail,
                pictureBase64: connection.requesterPictureBase64
            };
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
                        <Users className="h-5 w-5 text-sky-500" />
                        My Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                        <span className="ml-2 text-gray-600">Loading connections...</span>
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
                        <Users className="h-5 w-5 text-sky-500" />
                        My Connections
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
                    <Users className="h-5 w-5 text-sky-500" />
                    My Connections
                    <Badge className="ml-2 bg-sky-100 text-sky-800 border-sky-200">
                        {connections.length}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-gray-600">
                    Your professional network connections
                </CardDescription>
            </CardHeader>
            <CardContent>
                {connections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No connections yet</p>
                        <p className="text-sm text-gray-400">Start connecting with other professionals!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connections.map((connection) => {
                            const user = getConnectionUser(connection);
                            return (
                                <div
                                    key={connection.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-sky-300 transition-colors duration-200 cursor-pointer"
                                    onClick={() => handleUserClick(user.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                            {user.pictureBase64 ? (
                                                <AvatarImage src={`data:image/jpeg;base64,${user.pictureBase64}`} />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{user.name || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-sky-600 hover:bg-sky-100 hover:text-sky-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle message click
                                            }}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveConnection(connection.id);
                                            }}
                                            disabled={actionLoading[connection.id]}
                                            className="text-red-600 hover:bg-red-100 hover:text-red-700"
                                        >
                                            {actionLoading[connection.id] ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <UserX className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ConnectionsList;