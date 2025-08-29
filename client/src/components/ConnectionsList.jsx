"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        if (profileId) router.push(`/user/${profileId}`);
    };

    // Render states
    if (loading) {
        return (
            <div className={`flex items-center justify-center py-10 ${className}`}>
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                <span className="ml-2 text-slate-600 dark:text-slate-400">Loading connections...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`text-center py-8 ${className}`}>
                <p className="text-red-600 text-sm font-medium">Error: {error}</p>
            </div>
        );
    }

    if (connections.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 text-white flex items-center justify-center shadow-sm ring-1 ring-white/50 dark:ring-slate-800/50">
                    <Users className="h-7 w-7" />
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">No connections yet</p>
                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">Start connecting with other professionals!</p>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {connections.map((connection) => {
                const user = getConnectionUser(connection);
                return (
                    <div
                        key={connection.id}
                        className="group flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/40 dark:hover:border-teal-400/40 backdrop-blur-sm transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user.id)}
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Avatar className="h-11 w-11 rounded-xl ring-2 ring-white/60 dark:ring-slate-800/60 overflow-hidden">
                                {user.pictureBase64 ? (
                                    <AvatarImage src={`data:image/jpeg;base64,${user.pictureBase64}`} />
                                ) : (
                                    <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white text-sm font-semibold">
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                            <div className="flex-1 truncate">
                                <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">{user.name || 'Unknown User'}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                        </div>
                        <div className="flex items-center gap-1.5 ml-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 dark:hover:bg-teal-400/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: open message modal / navigate to messages tab
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
                                disabled={!!actionLoading[connection.id]}
                                className="h-8 w-8 p-0 rounded-full text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-400/10"
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
    );
};

export default ConnectionsList;