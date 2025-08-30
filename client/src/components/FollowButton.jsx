'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';

export default function FollowButton({
    targetUserId,
    targetUserName,
    userRole,
    className = ""
}) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const { showSuccess, showError } = useNotifications();

    useEffect(() => {
        if (targetUserId) {
            fetchFollowStatus();
        }
    }, [targetUserId]);

    const fetchFollowStatus = async () => {
        try {
            setLoading(true);
            const response = await apiFetch(`/api/follow/status/${targetUserId}`);

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(data.isFollowing);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        setActionLoading(true);
        try {
            const response = await apiFetch(`/api/follow/${targetUserId}`, {
                method: 'POST'
            });

            if (response.ok) {
                setIsFollowing(true);
                showSuccess('Followed Successfully', `You are now following ${targetUserName || 'this user'}`);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to follow user');
            }
        } catch (err) {
            setError(err.message);
            showError('Failed to Follow', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnfollow = async () => {
        setActionLoading(true);
        try {
            const response = await apiFetch(`/api/follow/${targetUserId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setIsFollowing(false);
                showSuccess('Unfollowed Successfully', `You have unfollowed ${targetUserName || 'this user'}`);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to unfollow user');
            }
        } catch (err) {
            setError(err.message);
            showError('Failed to Unfollow', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Only show follow button for Employer accounts
    if (userRole !== 'Employer') {
        return null;
    }

    if (loading) {
        return (
            <Button variant="outline" disabled className={`bg-gray-100 text-gray-600 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
            </Button>
        );
    }

    if (error && !isFollowing) {
        return (
            <Button variant="outline" disabled className={`bg-red-100 text-red-700 border-red-200 ${className}`}>
                Error
            </Button>
        );
    }

    return (
        <Button
            onClick={isFollowing ? handleUnfollow : handleFollow}
            disabled={actionLoading}
            variant={isFollowing ? "outline" : "default"}
            className={`${isFollowing
                    ? 'border-red-200 text-red-700 hover:bg-red-50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${className}`}
        >
            {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isFollowing ? (
                <UserMinus className="h-4 w-4 mr-2" />
            ) : (
                <UserPlus className="h-4 w-4 mr-2" />
            )}
            {actionLoading
                ? 'Processing...'
                : isFollowing
                    ? 'Unfollow'
                    : 'Follow'
            }
        </Button>
    );
}
