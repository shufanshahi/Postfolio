'use client';
import { useState, useEffect } from 'react';
import { postServiceFetch } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    X,
    Calendar,
    User,
    Tag,
    FileText,
    Award,
    Code,
    Briefcase,
    Loader2,
    AlertCircle
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
            const response = await postServiceFetch(`/api/cv/post/${postId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch post');
            }
            const postData = await response.json();
            setPost(postData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'experience': return <Briefcase className="h-4 w-4 text-blue-400" />;
            case 'project': return <Code className="h-4 w-4 text-purple-400" />;
            case 'achievement': return <Award className="h-4 w-4 text-yellow-400" />;
            default: return <FileText className="h-4 w-4 text-gray-400" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'experience': return 'bg-blue-900/50 text-blue-300 border-blue-800';
            case 'project': return 'bg-purple-900/50 text-purple-300 border-purple-800';
            case 'achievement': return 'bg-yellow-900/50 text-yellow-300 border-yellow-800';
            default: return 'bg-gray-900/50 text-gray-300 border-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-400" />
                        Original Post
                    </DialogTitle>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <Separator className="bg-gray-700" />

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                            <p className="text-gray-300">Loading original post...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-900/50 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Error loading post</h3>
                            <p className="text-gray-400">{error}</p>
                        </div>
                    </div>
                )}

                {post && !loading && (
                    <div className="space-y-6">
                        {/* CV Heading */}
                        <div className="p-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 rounded-lg border border-green-800/30">
                            <h3 className="text-lg font-semibold text-green-300 mb-2">CV Heading</h3>
                            <p className="text-gray-200">{cvHeading}</p>
                        </div>

                        {/* Post Type Badge */}
                        <div className="flex items-center gap-2">
                            {getTypeIcon(post.type)}
                            <Badge className={`${getTypeColor(post.type)} border`}>
                                {post.type?.toLowerCase().replace(/_/g, ' ')}
                            </Badge>
                        </div>

                        {/* Post Content */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Original Post Content</h3>
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                                    {post.content}
                                </p>
                            </div>
                        </div>

                        {/* Post Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">Posted</p>
                                    <p className="text-xs text-gray-400">{formatDate(post.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-white">Author</p>
                                    <p className="text-xs text-gray-400">{post.profileName || 'Unknown'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-400" />
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 border-gray-600"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Auto-tagged indicator */}
                        {post.autoTagged && (
                            <div className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <p className="text-sm text-blue-300">AI-generated tags</p>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
} 