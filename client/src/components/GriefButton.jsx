'use client';
import { useState, useEffect } from 'react';

export default function GriefButton({ postId, onGriefChange }) {
    const [isGriefed, setIsGriefed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial grief state
    useEffect(() => {
        fetchGriefState();
    }, [postId]);

    const fetchGriefState = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/grief-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setIsGriefed(data.userGriefed);
            }
        } catch (err) {
            console.error('Failed to fetch grief state:', err);
        }
    };

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
                const newGriefState = data.isGriefed !== undefined ? data.isGriefed : !isGriefed;
                setIsGriefed(newGriefState);

                // Notify parent component of the change
                if (onGriefChange) {
                    onGriefChange(postId, newGriefState);
                }
            }
        } catch (err) {
            console.error('Failed to grief post:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Sad face emoji component
    const SadFace = ({ className }) => <div className={className}>😢</div>;

    return (
        <button
            onClick={handleGrief}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${isGriefed
                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800'
                }`}
        >
            <SadFace className={`h-4 w-4 ${isGriefed ? 'animate-pulse' : ''} ${isLoading ? 'opacity-50' : ''}`} />
            {isLoading ? 'Loading...' : (isGriefed ? 'Griefed' : 'Grief')}
        </button>
    );
}
