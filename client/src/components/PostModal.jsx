'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    X,
    Calendar,
    Tag,
    Award,
    Code,
    Briefcase,
    Loader2,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';

export default function PostModal({ isOpen, onClose, postId, cvHeading }) {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && postId) {
            fetchPost();
        }
    }, [isOpen, postId]);

    const fetchPost = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiFetch(`/api/cv/post/${postId}`, {
                method: 'GET',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Please login again');
                } else if (response.status === 403) {
                    throw new Error('Access denied - You don\'t have permission');
                } else if (response.status === 404) {
                    throw new Error('Post not found');
                }
                throw new Error(`Failed to fetch post: ${response.status} ${response.statusText}`);
            }

            const postData = await response.json();
            setPost(postData);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'experience': return <Briefcase className="h-4 w-4 text-blue-500" />;
            case 'project': return <Code className="h-4 w-4 text-purple-500" />;
            case 'achievement': return <Award className="h-4 w-4 text-yellow-500" />;
            default: return <Briefcase className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'experience': return 'bg-blue-100 text-blue-800';
            case 'project': return 'bg-purple-100 text-purple-800';
            case 'achievement': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const renderImages = (images) => {
        if (!images || images.length === 0) return null;

        // Debug: Log the first image to see its format
        if (images.length > 0) {
            console.log('First image data:', images[0].substring(0, 50) + '...');
            console.log('Total images:', images.length);
        }

        if (images.length === 1) {
            return (
                <div className="mt-4">
                    <img
                        src={images[0]}
                        alt="Post content"
                        className="w-full rounded-lg max-h-96 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            );
        }

        if (images.length === 2) {
            return (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Post content ${index + 1}`}
                            className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                            onError={(e) => {
                                console.error('Failed to load image:', e);
                                e.target.style.display = 'none';
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (images.length === 3) {
            return (
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <img
                        src={images[0]}
                        alt="Post content 1"
                        className="w-full rounded-lg h-48 object-cover col-span-2 border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    <img
                        src={images[1]}
                        alt="Post content 2"
                        className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    <img
                        src={images[2]}
                        alt="Post content 3"
                        className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            );
        }

        // For 4 or more images
        return (
            <div className="mt-4 grid grid-cols-2 gap-2">
                <img
                    src={images[0]}
                    alt="Post content 1"
                    className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <img
                    src={images[1]}
                    alt="Post content 2"
                    className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <img
                    src={images[2]}
                    alt="Post content 3"
                    className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <div className="relative">
                    <img
                        src={images[3]}
                        alt="Post content 4"
                        className="w-full rounded-lg h-48 object-cover border border-white/40 dark:border-slate-600/40 backdrop-blur-sm shadow-sm"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    {images.length > 4 && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/40 dark:border-slate-600/40">
                            <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/20 backdrop-blur-sm rounded-full text-gray-700 dark:text-white hover:bg-black/30 transition-all"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-gray-600">Loading post...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading post</h3>
                            <p className="text-gray-600">{error}</p>
                        </div>
                    </div>
                )}

                {post && !loading && (
                    <div className="bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60">
                        {/* CV Heading Banner */}
                        <div className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-5 w-5" />
                                <span className="text-sm font-medium">CV Entry</span>
                            </div>
                            <h2 className="text-lg font-semibold">{cvHeading}</h2>
                        </div>

                        {/* Post Header */}
                        <div className="p-4 border-b border-teal-100/50 dark:border-slate-700/50 backdrop-blur-sm">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-teal-200 to-indigo-200 dark:from-slate-700 dark:to-slate-600 flex-shrink-0 border border-white/40 dark:border-slate-600/40">
                                        {post.userProfilePicture ? (
                                            <img
                                                src={`data:image/jpeg;base64,${post.userProfilePicture}`}
                                                alt={post.userName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Failed to load profile picture:', e);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                                                {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                                {post.userName || 'Unknown User'}
                                            </h3>
                                            {post.userPosition && (
                                                <Badge className={`${getTypeColor(post.type)} text-xs border-0 backdrop-blur-sm`}>
                                                    {getTypeIcon(post.type)}
                                                    {post.type?.toLowerCase().replace(/_/g, ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                        {post.userPosition && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{post.userPosition}</p>
                                        )}
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-teal-100/50 dark:hover:bg-slate-700/50 rounded-full transition-colors backdrop-blur-sm">
                                    <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                            <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap mb-4">
                                {post.content}
                            </div>

                            {/* Images */}
                            {renderImages(post.images)}

                            {/* Tags */}
                            {post.tags && post.tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {post.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            className="px-3 py-1 text-sm bg-teal-100/70 text-teal-800 hover:bg-teal-200/70 dark:bg-slate-700/70 dark:text-teal-300 dark:hover:bg-slate-600/70 transition-colors backdrop-blur-sm border-0"
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 