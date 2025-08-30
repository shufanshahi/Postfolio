"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
            <div className={`flex items-center justify-center py-10 ${className}`}>
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                <span className="ml-2 text-slate-600 dark:text-slate-400">Loading requests...</span>
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

    if (pendingRequests.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 text-white flex items-center justify-center shadow-sm ring-1 ring-white/50 dark:ring-slate-800/50">
                    <Users className="h-7 w-7" />
                </div>
                <p className="text-slate-700 dark:text-slate-200 font-medium">No pending requests</p>
                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">When someone sends you a request it will appear here</p>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {pendingRequests.map((request) => (
                <div
                    key={request.id}
                    className="group flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/40 dark:hover:border-teal-400/40 backdrop-blur-sm transition-colors"
                    onClick={() => handleUserClick(request.requesterProfileId)}
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                        <Avatar className="h-11 w-11 rounded-xl ring-2 ring-white/60 dark:ring-slate-800/60 overflow-hidden">
                            {request.requesterPictureBase64 ? (
                                <AvatarImage src={`data:image/jpeg;base64,${request.requesterPictureBase64}`} />
                            ) : (
                                <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white text-sm font-semibold">
                                    {request.requesterName?.charAt(0)?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="flex-1 truncate">
                            <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">{request.requesterName || 'Unknown User'}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{request.requesterEmail}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(request.id);
                            }}
                            disabled={actionLoading[request.id]}
                            size="sm"
                            className="h-8 px-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium flex items-center gap-1.5"
                        >
                            {actionLoading[request.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserCheck className="h-4 w-4" />
                            )}
                            Accept
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReject(request.id);
                            }}
                            disabled={actionLoading[request.id]}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-400/10"
                        >
                            {actionLoading[request.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <UserX className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PendingRequests;