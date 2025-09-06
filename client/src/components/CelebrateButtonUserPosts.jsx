'use client';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function CelebrateButtonUserPosts({ postId, initialState }) {
    const [celebrateState, setCelebrateState] = useState({
        userCelebrated: false,
        celebrationCount: 0,
        ...initialState
    });
    const [isLoading, setIsLoading] = useState(false);
    const { showSuccess, showError, showInfo } = useNotifications();

    useEffect(() => {
        if (initialState) {
            setCelebrateState(initialState);
        }
    }, [initialState]);

    const handleCelebrate = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;

        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/celebrate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Update celebrate state
                setCelebrateState({
                    userCelebrated: data.userCelebrated,
                    celebrationCount: data.celebrationCount
                });

                // Show appropriate toast with confetti emoji
                if (data.isCelebrated) {
                    showSuccess('🎉 Celebrated!', 'You celebrated this post with confetti!');
                } else {
                    showInfo('Uncelebrated', 'You removed your celebration');
                }
            } else {
                throw new Error('Failed to toggle celebration');
            }
        } catch (err) {
            showError('Error', 'Failed to celebrate post');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCelebrate}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${celebrateState.userCelebrated
                ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 scale-110'
                : 'text-gray-600 hover:text-orange-500 hover:scale-105 hover:bg-orange-50'
                }`}
        >
            <span className={`text-lg ${celebrateState.userCelebrated ? 'animate-bounce' : ''} ${isLoading ? 'opacity-50' : ''}`}>
                🎉
            </span>
            <span className="font-medium">
                {isLoading ? 'Loading...' : (celebrateState.userCelebrated ? 'Celebrated' : 'Celebrate')}
                {celebrateState.celebrationCount > 0 && ` (${celebrateState.celebrationCount})`}
            </span>
        </button>
    );
}
