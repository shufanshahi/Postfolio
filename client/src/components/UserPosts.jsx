'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    MessageSquare, 
    Heart, 
    Share2, 
    Clock, 
    Tag,
    Loader2,
    AlertCircle
} from 'lucide-react';

export default function UserPosts({ profileId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                    <p className="text-gray-400">Loading posts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-red-400 font-medium">{error}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-gray-400">This user hasn't shared any posts yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <Card key={post.id} className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl hover:border-green-400/30 transition-all duration-300">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarFallback className="bg-green-500 text-white text-sm">
                                        {post.profileName?.slice(0, 2)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-white">{post.profileName || 'Unknown User'}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
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
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        {post.type}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                        <p className="text-gray-200 leading-relaxed mb-4">{post.content}</p>
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="bg-blue-500/10 text-blue-400 border-blue-500/30"
                                    >
                                        <Tag className="h-3 w-3 mr-1" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        
                        {/* Interaction Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors duration-200">
                                    <Heart className="h-4 w-4" />
                                    <span className="text-sm">Like</span>
                                </button>
                                <button className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors duration-200">
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="text-sm">Comment</span>
                                </button>
                                <button className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors duration-200">
                                    <Share2 className="h-4 w-4" />
                                    <span className="text-sm">Share</span>
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
} 