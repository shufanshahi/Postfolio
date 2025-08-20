"use client"
import Navbar from '@/components/Navbar';
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
    const [activeNav, setActiveNav] = useState('feed');
    const fileInputRef = useRef(null);

    // Icons using the same style as your dashboard
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
    const Heart = ({ className }) => <div className={className}>❤️</div>;
    const Share = ({ className }) => <div className={className}>↗️</div>;
    const Bookmark = ({ className }) => <div className={className}>🔖</div>;
    const MoreHorizontal = ({ className }) => <div className={className}>⋯</div>;
    const Briefcase = ({ className }) => <div className={className}>💼</div>;
    const FileText = ({ className }) => <div className={className}>📝</div>;
    const Settings = ({ className }) => <div className={className}>⚙️</div>;
    const LogOut = ({ className }) => <div className={className}>🚪</div>;
    const Bell = ({ className }) => <div className={className}>🔔</div>;
    const Search = ({ className }) => <div className={className}>🔍</div>;

   

    const MobileNavItem = ({ icon, label, isActive, onClick }) => {
        return (
            <button
                onClick={onClick}
                className={`flex flex-col items-center px-2 py-2 text-xs font-medium w-16 ${
                    isActive 
                    ? 'text-sky-600' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
            >
                {icon}
                <span className="mt-1">{label}</span>
            </button>
        );
    };

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
            return <Trophy className="h-5 w-5 text-amber-500" />;
        } else if (content.includes('streak') || content.includes('day')) {
            return <Flame className="h-5 w-5 text-orange-500" />;
        } else if (content.includes('completed') || content.includes('finished')) {
            return <Star className="h-5 w-5 text-yellow-500" />;
        } else {
            return <Zap className="h-5 w-5 text-green-500" />;
        }
    };

    const openImagePreview = (image) => {
        setImagePreviewModal({ show: true, image });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
                <Navbar />
                <div className="max-w-2xl mx-auto p-4">
                    <div className="flex items-center justify-center h-64">
                        <Loader className="h-8 w-8 text-slate-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
            <Navbar/>
            <div className="max-w-2xl mx-auto p-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                <Home className="h-6 w-6 text-slate-700" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                My Feed
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowCreatePost(!showCreatePost)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium shadow-sm transform transition-all duration-200 flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New Post</span>
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2 mb-6 bg-white backdrop-blur-lg rounded-xl p-1 border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setFilter('friends')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                                filter === 'friends'
                                    ? 'bg-slate-100 text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Users className="h-4 w-4" />
                            <span>Friends & Me</span>
                        </button>
                        <button
                            onClick={() => setFilter('me')}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                                filter === 'me'
                                    ? 'bg-slate-100 text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <User className="h-4 w-4" />
                            <span>My Posts</span>
                        </button>
                    </div>

                    {/* Create Post Section */}
                    {showCreatePost && (
                        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {getInitials('User')}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        placeholder="What's on your mind?"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
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
                                            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors text-sm"
                                            disabled={selectedImages.length >= 4}
                                        >
                                            <ImageIcon className="h-4 w-4" />
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
                                                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex space-x-2">
                                            <span className="px-2 py-1 bg-sky-100 text-sky-700 border border-sky-200 rounded-full text-xs">
                                                Auto-tagged
                                            </span>
                                        </div>
                                        <button
                                            onClick={createPost}
                                            disabled={posting || (!newPostContent.trim() && selectedImages.length === 0)}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 flex items-center space-x-2 text-sm"
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
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                            <div className="text-slate-500 mb-4">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">No posts yet</h3>
                                <p className="text-slate-500 text-sm">
                                    {filter === 'friends' ? 'Connect with people to see their posts in your feed!' : 'Create your first post to get started!'}
                                </p>
                            </div>
                            {filter === 'me' && (
                                <button
                                    onClick={() => setShowCreatePost(true)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transform transition-all duration-200 flex items-center space-x-2 mx-auto text-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Create First Post</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-sm transition-all duration-300">
                                <div className="p-4">
                                    <div className="flex items-start space-x-3">
                                        {/* User Avatar */}
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                                            {post.profilePictureBase64 ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${post.profilePictureBase64}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials(post.profileName)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* User Info and Time */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800 text-sm">
                                                        {post.profileName || 'Anonymous'}
                                                    </h3>
                                                    <p className="text-slate-500 text-xs">{formatDate(post.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {getAchievementIcon(post)}
                                                    <button className="text-slate-400 hover:text-slate-600">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <p className="text-slate-700 mb-3 leading-relaxed text-sm">
                                                {post.content}
                                            </p>

                                            {/* Post Images */}
                                            {post.hasImages && post.images && post.images.length > 0 && (
                                                <div className={`mb-3 grid gap-2 rounded-lg overflow-hidden ${
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
                                                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300 rounded-lg"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {post.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Engagement Bar */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                                <button
                                                    onClick={() => handleCelebrate(post.id)}
                                                    className="flex items-center space-x-1 text-slate-500 hover:text-sky-600 text-xs font-medium"
                                                >
                                                    <PartyPopper className="h-4 w-4" />
                                                    <span>Celebrate</span>
                                                </button>
                                                
                                                <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 text-xs">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <span>Comment</span>
                                                </button>
                                                
                                                <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 text-xs">
                                                    <Share className="h-4 w-4" />
                                                    <span>Share</span>
                                                </button>
                                                
                                                <button className="flex items-center space-x-1 text-slate-500 hover:text-slate-700 text-xs">
                                                    <Bookmark className="h-4 w-4" />
                                                    <span>Save</span>
                                                </button>
                                            </div>

                                            {/* Reaction Count */}
                                            {(post.reactions?.length > 0) && (
                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                    <button
                                                        onClick={() => toggleReactions(post.id)}
                                                        className="flex items-center space-x-1 text-slate-500 text-xs"
                                                    >
                                                        <div className="flex items-center space-x-0.5">
                                                            <PartyPopper className="h-3 w-3 text-amber-500" />
                                                            <Sparkles className="h-3 w-3 text-purple-500" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {post.reactions.length} celebrations
                                                        </span>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Reactions List */}
                                            {showReactions[post.id] && post.reactions && post.reactions.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-slate-100">
                                                    <h4 className="text-xs font-medium text-slate-600 mb-2">Celebrated by:</h4>
                                                    <div className="space-y-2">
                                                        {post.reactions.map((reaction, index) => (
                                                            <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
                                                                <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                                    {getInitials(reaction.userName)}
                                                                </div>
                                                                <span className="text-xs text-slate-700 font-medium">{reaction.userName}</span>
                                                                <PartyPopper className="h-3 w-3 text-amber-500 ml-auto" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comment Input */}
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                                        {getInitials('You')}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent text-xs"
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
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setImagePreviewModal({ show: false, image: null })}
                    >
                        <div className="relative max-w-4xl max-h-full">
                            <img
                                src={imagePreviewModal.image}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={() => setImagePreviewModal({ show: false, image: null })}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}