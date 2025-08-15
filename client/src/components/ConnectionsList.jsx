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
            <Card className={`bg-gray-800 border-gray-700 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Users className="h-5 w-5 text-blue-400" />
                        My Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                        <span className="ml-2 text-gray-300">Loading connections...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`bg-gray-800 border-gray-700 ${className}`}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Users className="h-5 w-5 text-blue-400" />
                        My Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-400 text-center py-4">
                        Error: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`bg-gray-800 border-gray-700 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Users className="h-5 w-5 text-blue-400" />
                    My Connections
                    <Badge className="ml-2 bg-gradient-to-r from-blue-900/50 to-blue-800/50 text-blue-300 border-blue-800">
                        {connections.length}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Your professional network connections
                </CardDescription>
            </CardHeader>
            <CardContent>
                {connections.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No connections yet</p>
                        <p className="text-sm text-gray-500">Start connecting with other professionals!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connections.map((connection) => {
                            const user = getConnectionUser(connection);
                            return (
                                <div
                                    key={connection.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-green-500/30 transition-colors duration-200 cursor-pointer"
                                    onClick={() => handleUserClick(user.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10">
                                            {user.pictureBase64 ? (
                                                <AvatarImage src={`data:image/jpeg;base64,${user.pictureBase64}`} />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-white">{user.name || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
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
                                            className="text-red-400 hover:bg-red-900/20 hover:text-red-300"
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