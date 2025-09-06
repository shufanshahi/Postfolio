'use client';
import { useState, useEffect } from 'react';

export default function CelebrateButton({ postId, onCelebrationChange }) {
    const [isCelebrated, setIsCelebrated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial celebration state
    useEffect(() => {
        fetchCelebrationState();
    }, [postId]);

    const fetchCelebrationState = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/celebration-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsCelebrated(data.userCelebrated);
            }
        } catch (err) {
            console.error('Failed to fetch celebration state:', err);
        }
    };

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
                const newCelebrationState = data.isCelebrated !== undefined ? data.isCelebrated : !isCelebrated;
                setIsCelebrated(newCelebrationState);

                // Notify parent component of the change
                if (onCelebrationChange) {
                    onCelebrationChange(postId, newCelebrationState);
                }
            }
        } catch (err) {
            console.error('Failed to celebrate post:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Party popper emoji component
    const PartyPopper = ({ className }) => <div className={className}>🎉</div>;

    return (
        <button
            onClick={handleCelebrate}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isCelebrated
                    ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
                    : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800'
                }`}
        >
            <PartyPopper className={`h-4 w-4 ${isCelebrated ? 'animate-bounce' : ''} ${isLoading ? 'opacity-50' : ''}`} />
            {isLoading ? 'Loading...' : (isCelebrated ? 'Celebrated' : 'Celebrate')}
        </button>
    );
}
