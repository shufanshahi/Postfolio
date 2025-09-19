'use client';
import { useState, useEffect } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
    Avatar, AvatarImage, AvatarFallback
} from '@/components/ui/avatar';

export default function ReactionsModal({ isOpen, onClose, reactions, postId }) {
    const [fetchedReactions, setFetchedReactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            fetchReactions();
        }
    }, [isOpen, postId]);

    const fetchReactions = async () => {
        if (!postId) return;

        setLoading(true);
        try {
            const response = await apiFetch(`/api/posts/${postId}/reactions`);
            if (response.ok) {
                const reactionsData = await response.json();
                setFetchedReactions(reactionsData);
            }
        } catch (error) {
            console.error('Failed to fetch reactions:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Use fetched reactions if available, otherwise fallback to passed reactions
    const displayReactions = fetchedReactions.length > 0 ? fetchedReactions : reactions || [];

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    const getReactionIcon = (reaction) => {
        // The backend sends reactions with a 'type' field containing enum values like "GRIEF" or "CELEBRATE"
        const reactionType = reaction.type;

        if (reactionType === 'GRIEF') {
            return <span className="text-lg">😢</span>;
        } else if (reactionType === 'CELEBRATE') {
            return <PartyPopper className="h-4 w-4 text-amber-500" />;
        }

        // Default to celebrate if we can't determine the type
        return <PartyPopper className="h-4 w-4 text-amber-500" />;
    };

    const getHeaderIcons = () => {
        if (!displayReactions || displayReactions.length === 0) return [];

        const reactionTypes = new Set();
        displayReactions.forEach(reaction => {
            const reactionType = reaction.type;
            if (reactionType === 'GRIEF') {
                reactionTypes.add('grief');
            } else if (reactionType === 'CELEBRATE') {
                reactionTypes.add('celebrate');
            }
        });

        const icons = [];
        if (reactionTypes.has('celebrate')) {
            icons.push(<PartyPopper key="celebrate" className="h-5 w-5 text-amber-500" />);
        }
        if (reactionTypes.has('grief')) {
            icons.push(<span key="grief" className="text-xl">😢</span>);
        }

        return icons;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-0.5">
                            {getHeaderIcons()}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Reactions ({displayReactions?.length || 0})
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <p>Loading reactions...</p>
                        </div>
                    ) : displayReactions && displayReactions.length > 0 ? (
                        displayReactions.map((reaction, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Avatar className="h-10 w-10 ring-2 ring-white/60 dark:ring-slate-800/60 shadow-sm">
                                    <AvatarImage
                                        src={reaction.pictureBase64 ? `data:image/jpeg;base64,${reaction.pictureBase64}` : undefined}
                                        alt="Profile Picture"
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white font-bold text-sm">
                                        {getInitials(reaction.userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {reaction.userName}
                                    </span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        reacted to this post
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {getReactionIcon(reaction)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <PartyPopper className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No reactions yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}