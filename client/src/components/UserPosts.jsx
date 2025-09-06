'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CelebrateButtonUserPosts from '@/components/CelebrateButtonUserPosts';
import {
    MessageSquare,
    Heart,
    Clock,
    Tag,
    Loader2,
    AlertCircle
} from 'lucide-react';

export default function UserPosts({ profileId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [celebrateStates, setCelebrateStates] = useState({}); // Track celebrate states for each post
    const { showSuccess, showError, showInfo } = useNotifications();

    useEffect(() => {
        if (profileId) {
            fetchUserPosts();
        }
    }, [profileId]);

    const fetchUserPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiFetch(`/api/posts/profile/${profileId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const data = await response.json();
            setPosts(data);

            // Initialize celebrate states for each post
            const initialCelebrateStates = {};
            for (const post of data) {
                try {
                    const celebrateResponse = await apiFetch(`/api/posts/${post.id}/celebration-info`);
                    if (celebrateResponse.ok) {
                        const celebrateData = await celebrateResponse.json();
                        initialCelebrateStates[post.id] = {
                            userCelebrated: celebrateData.userCelebrated,
                            celebrationCount: celebrateData.celebrationCount
                        };
                    }
                } catch (err) {
                    console.error('Failed to fetch celebration info for post', post.id);
                    initialCelebrateStates[post.id] = {
                        userCelebrated: false,
                        celebrationCount: 0
                    };
                }
            }
            setCelebrateStates(initialCelebrateStates);
        } catch (err) {
            setError(err.message);
            showError('Error', 'Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                    <p className="text-gray-600">Loading posts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-300">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-300">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600">This user hasn't shared any posts yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => {
                const celebrateState = celebrateStates[post.id] || { userCelebrated: false, celebrationCount: 0 };

                return (
                    <Card key={post.id} className="bg-white border border-gray-200 rounded-2xl hover:border-sky-300 transition-all duration-300 shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className="bg-sky-500 text-white text-sm">
                                            {post.profileName?.slice(0, 2)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{post.profileName || 'Unknown User'}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {new Date(post.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {post.type && (
                                        <Badge className="bg-sky-100 text-sky-700 border-sky-200">
                                            {post.type}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-sky-100 text-sky-700 border-sky-200"
                                        >
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Interaction Buttons */}
                            <div className="flex items-center justify-start pt-4 border-t border-gray-200">
                                <CelebrateButtonUserPosts
                                    postId={post.id}
                                    initialState={celebrateState}
                                />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}