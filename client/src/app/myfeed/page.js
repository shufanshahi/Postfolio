"use client"
import React, { useState, useEffect, useRef } from 'react';



export default function MyFeedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('friends');
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [profileId, setProfileId] = useState(null);
    const [showReactions, setShowReactions] = useState({});
    const [selectedImages, setSelectedImages] = useState([]);
    const [imagePreviewModal, setImagePreviewModal] = useState({ show: false, image: null });
    const fileInputRef = useRef(null);

    const Home = ({ className }) => <div className={className}>🏠</div>;
    const User = ({ className }) => <div className={className}>👤</div>;
    const Users = ({ className }) => <div className={className}>👥</div>;
    const Plus = ({ className }) => <div className={className}>➕</div>;
    const Send = ({ className }) => <div className={className}>📤</div>;
    const ImageIcon = ({ className }) => <div className={className}>🖼️</div>;
    const X = ({ className }) => <div className={className}>❌</div>;
    const PartyPopper = ({ className }) => <div className={className}>🎉</div>;
    const Sparkles = ({ className }) => <div className={className}>✨</div>;
    const Trophy = ({ className }) => <div className={className}>🏆</div>;
    const Flame = ({ className }) => <div className={className}>🔥</div>;
    const Star = ({ className }) => <div className={className}>⭐</div>;
    const Zap = ({ className }) => <div className={className}>⚡</div>;
    const AlertCircle = ({ className }) => <div className={className}>⚠️</div>;
    const MessageSquare = ({ className }) => <div className={className}>💬</div>;
    const Loader = ({ className }) => <div className={`${className} animate-spin`}>⌛</div>;

    useEffect(() => {
        fetchProfileId();
    }, []);

    useEffect(() => {
        if (profileId !== null) {
            fetchFeed();
        }
    }, [filter, profileId]);

    const fetchProfileId = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/profile/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfileId(data.id);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            let url = '/api/posts/feed';
            if (filter === 'me') url = `/api/posts/profile/${profileId}`;

            const response = await fetch(`http://localhost:8080${url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch feed');
            const data = await response.json();
            setPosts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (selectedImages.length + files.length > 4) {
            alert('Maximum 4 images allowed per post');
            return;
        }

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImages(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const createPost = async () => {
        if (!newPostContent.trim() && selectedImages.length === 0) return;

        try {
            setPosting(true);
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:8080/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newPostContent || "Shared some photos",
                    profileId: profileId,
                    images: selectedImages
                })
            });

            if (!response.ok) throw new Error('Failed to create post');
            setNewPostContent('');
            setSelectedImages([]);
            setShowCreatePost(false);
            fetchFeed();
        } catch (err) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    };

    const handleCelebrate = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/posts/${postId}/celebrate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchFeed(); // Refresh to show updated reactions
            }
        } catch (err) {
            console.error('Failed to celebrate post:', err);
        }
    };

    const toggleReactions = (postId) => {
        setShowReactions(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
        return date.toLocaleDateString();
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    const getAchievementIcon = (post) => {
        const content = post.content.toLowerCase();
        if (content.includes('league') || content.includes('promoted')) {
            return <Trophy className="h-8 w-8 text-blue-500" />;
        } else if (content.includes('streak') || content.includes('day')) {
            return <Flame className="h-8 w-8 text-orange-500" />;
        } else if (content.includes('completed') || content.includes('finished')) {
            return <Star className="h-8 w-8 text-yellow-500" />;
        } else {
            return <Zap className="h-8 w-8 text-green-500" />;
        }
    };

    const openImagePreview = (image) => {
        setImagePreviewModal({ show: true, image });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <Loader className="h-12 w-12 text-green-400" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl shadow-lg">
                                <Home className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                My Feed
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowCreatePost(!showCreatePost)}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 hover:from-green-700 hover:via-blue-700 hover:to-purple-700 text-white rounded-2xl font-medium shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                        >
                            <Plus className="h-5 w-5" />
                            <span>New Post</span>
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2 mb-6 bg-black/30 backdrop-blur-lg rounded-2xl p-2 border border-gray-700/50">
                        <button
                            onClick={() => setFilter('friends')}
                            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                                filter === 'friends'
                                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700/50'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            <span>Friends & Me</span>
                        </button>
                        <button
                            onClick={() => setFilter('me')}
                            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                                filter === 'me'
                                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700/50'
                            }`}
                        >
                            <User className="h-4 w-4" />
                            <span>My Posts</span>
                        </button>
                    </div>

                    {/* Create Post Section */}
                    {showCreatePost && (
                        <div className="mb-6 bg-black/30 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {getInitials('User')}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        placeholder="What's on your mind?"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        className="w-full min-h-[120px] bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none backdrop-blur-sm"
                                    />

                                    {/* Image Upload Section */}
                                    <div className="mt-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl text-gray-300 transition-colors"
                                            disabled={selectedImages.length >= 4}
                                        >
                                            <ImageIcon className="h-5 w-5" />
                                            <span>Add Photos ({selectedImages.length}/4)</span>
                                        </button>
                                    </div>

                                    {/* Image Previews */}
                                    {selectedImages.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {selectedImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-xl border border-gray-600"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex space-x-2">
                                            <span className="px-3 py-1 bg-gradient-to-r from-green-900/50 to-blue-900/50 text-green-300 border border-green-800/50 rounded-full text-sm">
                                                Auto-tagged
                                            </span>
                                        </div>
                                        <button
                                            onClick={createPost}
                                            disabled={posting || (!newPostContent.trim() && selectedImages.length === 0)}
                                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                                        >
                                            {posting ? (
                                                <Loader className="h-4 w-4" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            <span>{posting ? 'Posting...' : 'Post'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/50 backdrop-blur-lg rounded-2xl p-4">
                        <div className="flex items-center space-x-2 text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className="bg-black/30 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                                <h3 className="text-2xl font-semibold text-white mb-2">No posts yet</h3>
                                <p className="text-gray-400 text-lg">
                                    {filter === 'friends' ? 'Connect with people to see their posts in your feed!' : 'Create your first post to get started!'}
                                </p>
                            </div>
                            {filter === 'me' && (
                                <button
                                    onClick={() => setShowCreatePost(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 mx-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create First Post</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="bg-black/30 backdrop-blur-lg border border-gray-700/50 hover:border-green-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:transform hover:scale-[1.02]">
                                <div className="p-6">
                                    <div className="flex items-start space-x-4">
                                        {/* User Avatar */}
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gradient-to-r from-green-500 to-blue-500">
                                            {post.profilePictureBase64 ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${post.profilePictureBase64}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                                    {getInitials(post.profileName)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            {/* User Info and Time */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-white text-xl">
                                                        {post.profileName || 'Anonymous'}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">{formatDate(post.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getAchievementIcon(post)}
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <p className="text-gray-200 mb-4 leading-relaxed text-lg">
                                                {post.content}
                                            </p>

                                            {/* Post Images */}
                                            {post.hasImages && post.images && post.images.length > 0 && (
                                                <div className={`mb-4 grid gap-2 rounded-2xl overflow-hidden ${
                                                    post.images.length === 1 ? 'grid-cols-1' :
                                                        post.images.length === 2 ? 'grid-cols-2' :
                                                            post.images.length === 3 ? 'grid-cols-2' :
                                                                'grid-cols-2'
                                                }`}>
                                                    {post.images.map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className={`relative cursor-pointer group ${
                                                                post.images.length === 3 && index === 0 ? 'col-span-2' : ''
                                                            }`}
                                                            onClick={() => openImagePreview(image)}
                                                        >
                                                            <img
                                                                src={image}
                                                                alt={`Post image ${index + 1}`}
                                                                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {post.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-gradient-to-r from-purple-900/50 to-purple-800/50 text-purple-300 border border-purple-800/50 rounded-full text-sm font-medium"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Celebrate Button */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                                                <button
                                                    onClick={() => handleCelebrate(post.id)}
                                                    className="px-6 py-3 bg-gradient-to-r from-yellow-600/20 to-pink-600/20 hover:from-yellow-600/30 hover:to-pink-600/30 text-white border border-gray-600/50 rounded-2xl font-medium transition-all duration-200 transform hover:scale-105 backdrop-blur-sm"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center space-x-1">
                                                            <PartyPopper className="h-5 w-5 text-yellow-400" />
                                                            <Sparkles className="h-4 w-4 text-pink-400" />
                                                        </div>
                                                        <span className="font-bold">CELEBRATE</span>
                                                    </div>
                                                </button>

                                                {/* Reaction Count */}
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => toggleReactions(post.id)}
                                                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700/30 rounded-xl transition-colors"
                                                    >
                                                        <div className="flex items-center space-x-1">
                                                            <PartyPopper className="h-4 w-4 text-yellow-400" />
                                                            <Sparkles className="h-3 w-3 text-pink-400" />
                                                        </div>
                                                        <span className="text-gray-300 font-medium">
                                                            {post.reactions?.length || 0}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Reactions List */}
                                            {showReactions[post.id] && post.reactions && post.reactions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                    <h4 className="text-sm font-medium text-gray-400 mb-3">Celebrations:</h4>
                                                    <div className="space-y-3">
                                                        {post.reactions.map((reaction, index) => (
                                                            <div key={index} className="flex items-center space-x-3 p-2 bg-gray-800/30 rounded-xl">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                                    {getInitials(reaction.userName)}
                                                                </div>
                                                                <span className="text-sm text-gray-200 font-medium">{reaction.userName}</span>
                                                                <span className="text-xs text-gray-400">celebrated this</span>
                                                                <PartyPopper className="h-4 w-4 text-yellow-400 ml-auto" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comment Input */}
                                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {getInitials('You')}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Image Preview Modal */}
                {imagePreviewModal.show && (
                    <div
                        className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
                        onClick={() => setImagePreviewModal({ show: false, image: null })}
                    >
                        <div className="relative max-w-4xl max-h-full">
                            <img
                                src={imagePreviewModal.image}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain rounded-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={() => setImagePreviewModal({ show: false, image: null })}
                                className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}