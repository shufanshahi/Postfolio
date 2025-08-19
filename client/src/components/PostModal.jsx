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
    Heart,
    MessageCircle,
    Share2,
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
                        className="w-full rounded-lg max-h-96 object-cover"
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
                            className="w-full rounded-lg h-48 object-cover"
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
                        className="w-full rounded-lg h-48 object-cover col-span-2"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    <img 
                        src={images[1]} 
                        alt="Post content 2"
                        className="w-full rounded-lg h-48 object-cover"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    <img 
                        src={images[2]} 
                        alt="Post content 3"
                        className="w-full rounded-lg h-48 object-cover"
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
                    className="w-full rounded-lg h-48 object-cover"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <img 
                    src={images[1]} 
                    alt="Post content 2"
                    className="w-full rounded-lg h-48 object-cover"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <img 
                    src={images[2]} 
                    alt="Post content 3"
                    className="w-full rounded-lg h-48 object-cover"
                    onError={(e) => {
                        console.error('Failed to load image:', e);
                        e.target.style.display = 'none';
                    }}
                />
                <div className="relative">
                    <img 
                        src={images[3]} 
                        alt="Post content 4"
                        className="w-full rounded-lg h-48 object-cover"
                        onError={(e) => {
                            console.error('Failed to load image:', e);
                            e.target.style.display = 'none';
                        }}
                    />
                    {images.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
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
                    <div className="bg-white">
                        {/* CV Heading Banner */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="h-5 w-5" />
                                <span className="text-sm font-medium">CV Entry</span>
                            </div>
                            <h2 className="text-lg font-semibold">{cvHeading}</h2>
                        </div>

                        {/* Post Header */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                                {post.userName?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900 truncate">
                                                {post.userName || 'Unknown User'}
                                            </h3>
                                            {post.userPosition && (
                                                <Badge className={`${getTypeColor(post.type)} text-xs`}>
                                                    {getTypeIcon(post.type)}
                                                    {post.type?.toLowerCase().replace(/_/g, ' ')}
                                                </Badge>
                                            )}
                                        </div>
                                        {post.userPosition && (
                                            <p className="text-sm text-gray-600">{post.userPosition}</p>
                                        )}
                                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-4">
                            <div className="text-gray-900 leading-relaxed whitespace-pre-wrap mb-4">
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
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Auto-tagged indicator */}
                            {post.autoTagged && (
                                <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-blue-700">AI-generated tags</p>
                                </div>
                            )}
                        </div>

                        {/* Post Actions */}
                        <div className="px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                                        <Heart className="h-5 w-5" />
                                        <span className="text-sm">Like</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                                        <MessageCircle className="h-5 w-5" />
                                        <span className="text-sm">Comment</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                                        <Share2 className="h-5 w-5" />
                                        <span className="text-sm">Share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 