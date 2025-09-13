'use client';
import { useState } from 'react';
import { PartyPopper, X } from 'lucide-react';

export default function ReactionsModal({ isOpen, onClose, reactions, postId }) {
    if (!isOpen) return null;

    const getInitials = (name) => {
        return name
            ?.split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U';
    };

    const getReactionIcon = (reaction) => {
        // Check various possible ways the reaction type might be stored
        const reactionType = reaction.reactionType || reaction.type || reaction.kind;

        // Also check if the API endpoint or reaction source indicates grief
        if (reactionType === 'grief' || reaction.isGrief || reaction.grief) {
            return <span className="text-lg">😢</span>;
        } else if (reactionType === 'celebrate' || reaction.isCelebrate || reaction.celebrate) {
            return <PartyPopper className="h-4 w-4 text-amber-500" />;
        }

        // Default to celebrate if we can't determine the type
        return <PartyPopper className="h-4 w-4 text-amber-500" />;
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
                            <PartyPopper className="h-5 w-5 text-amber-500" />
                            <span className="text-xl">😢</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            Reactions ({reactions?.length || 0})
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
                    {reactions && reactions.length > 0 ? (
                        reactions.map((reaction, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20 dark:ring-slate-800/50">
                                    {getInitials(reaction.userName)}
                                </div>
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