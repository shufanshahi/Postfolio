'use client';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function GriefButtonUserPosts({ postId, initialState }) {
    const [griefState, setGriefState] = useState({
        userGriefed: false,
        griefCount: 0,
        ...initialState
    });
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError, showInfo } = useNotifications();

    useEffect(() => {
        if (initialState) {
            setGriefState(initialState);
        }
    }, [initialState]);

    const handleGrief = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/grief`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Update grief state
                setGriefState({
                    userGriefed: data.userGriefed,
                    griefCount: data.griefCount
                });

                // Show appropriate toast with sad emoji
                if (data.isGriefed) {
                    showSuccess('😢 Griefed!', 'You expressed grief on this post');
                } else {
                    showInfo('Grief removed', 'You removed your grief reaction');
                }
            } else {
                throw new Error('Failed to toggle grief');
            }
        } catch (err) {
            showError('Error', 'Failed to grief post');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleGrief}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${griefState.userGriefed
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 scale-110'
                : 'text-gray-600 hover:text-indigo-600 hover:scale-105 hover:bg-indigo-50'
                }`}
        >
            <span className={`text-lg ${griefState.userGriefed ? 'animate-pulse' : ''} ${isLoading ? 'opacity-50' : ''}`}>
                😢
            </span>
            <span className="font-medium">
                {isLoading ? 'Loading...' : (griefState.userGriefed ? 'Griefed' : 'Grief')}
                {griefState.griefCount > 0 && ` (${griefState.griefCount})`}
            </span>
        </button>
    );
}
