"use client"
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import Navbar from '@/components/Navbar';
import CelebrateButton from '@/components/CelebrateButton';
import React, { useState, useEffect, useRef } from 'react';
// Reuse design tokens from dashboard for consistent theming
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

function MyFeedPage() {
    const { user } = useAuth();
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
    const [celebratedPosts, setCelebratedPosts] = useState({});
    const [showCelebratedModal, setShowCelebratedModal] = useState(false);
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
                className={`flex flex-col items-center px-2 py-2 text-xs font-medium w-16 ${isActive
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

            // Initialize celebration states for each post
            const initialCelebratedStates = {};
            for (const post of data) {
                try {
                    const celebrateResponse = await fetch(`http://localhost:8080/api/posts/${post.id}/celebration-info`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (celebrateResponse.ok) {
                        const celebrateData = await celebrateResponse.json();
                        initialCelebratedStates[post.id] = celebrateData.userCelebrated;
                    }
                } catch (err) {
                    console.error('Failed to fetch celebration info for post', post.id);
                    initialCelebratedStates[post.id] = false;
                }
            }
            setCelebratedPosts(initialCelebratedStates);
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

    const handleCelebrationChange = (postId, isCelebrated) => {
        setCelebratedPosts(prev => ({
            ...prev,
            [postId]: isCelebrated
        }));
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
                const data = await response.json();

                // Update celebrated posts state
                setCelebratedPosts(prev => ({
                    ...prev,
                    [postId]: data.isCelebrated || !prev[postId]
                }));

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
            <div className="min-h-screen relative overflow-hidden">
                <div className="pointer-events-none select-none absolute inset-0 -z-10">
                    <div className="absolute -top-24 -left-10 h-[34rem] w-[34rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                    <div className="absolute top-1/3 -right-32 h-[32rem] w-[32rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
                </div>
                <Navbar />
                <div className="max-w-3xl mx-auto px-6 py-24">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader className="h-8 w-8 text-teal-600" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your personalized feed...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none select-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
            </div>
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-sm text-sm font-semibold ring-1 ring-white/40">
                                <Home className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">My Feed</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Latest updates from your network</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowCreatePost(!showCreatePost)}
                                className="h-11 px-6 rounded-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white font-medium shadow-sm text-sm flex items-center gap-2 transition-colors"
                            >
                                <Plus className="h-4 w-4" />
                                {showCreatePost ? 'Close' : 'New Post'}
                            </button>
                            <button
                                onClick={() => setShowCelebratedModal(true)}
                                className="h-11 px-6 rounded-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-400 text-white font-medium shadow-sm text-sm flex items-center gap-2 transition-colors"
                            >
                                <PartyPopper className="h-4 w-4" />
                                Celebrated Posts
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 rounded-2xl p-1 bg-gradient-to-r from-teal-50/70 via-white/70 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur border border-teal-900/10 dark:border-slate-700/60 shadow-sm">
                        <button
                            onClick={() => setFilter('friends')}
                            className={`flex-1 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ring-1 ring-transparent ${filter === 'friends'
                                ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            <span>Network</span>
                        </button>
                        <button
                            onClick={() => setFilter('me')}
                            className={`flex-1 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ring-1 ring-transparent ${filter === 'me'
                                ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'
                                }`}
                        >
                            <User className="h-4 w-4" />
                            <span>My Posts</span>
                        </button>
                    </div>

                    {/* Create Post Section */}
                    {showCreatePost && (
                        <div className={`mb-8 rounded-2xl p-6 ${subtleCard} shadow-sm`}>
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/60 dark:ring-slate-800/60 shadow">
                                    {getInitials('User')}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        placeholder="What's on your mind?"
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        className="w-full min-h-[120px] bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent resize-none backdrop-blur"
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
                                            className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 rounded-lg text-slate-600 dark:text-slate-300 transition-colors text-xs font-medium"
                                            disabled={selectedImages.length >= 4}
                                        >
                                            <ImageIcon className="h-4 w-4" />
                                            <span>Add Photos ({selectedImages.length}/4)</span>
                                        </button>
                                    </div>

                                    {/* Image Previews */}
                                    {selectedImages.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            {selectedImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-36 object-cover rounded-xl border border-teal-900/10 dark:border-slate-700/60 shadow-sm"
                                                    />
                                                    <button
                                                        onClick={() => removeImage(index)}
                                                        className="absolute top-2 right-2 p-1 bg-rose-500/90 hover:bg-rose-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-6">
                                        <div className="flex gap-2 flex-wrap">
                                            <span className="px-2.5 py-1 bg-teal-600/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 border border-teal-600/20 dark:border-teal-400/30 rounded-full text-[10px] font-medium tracking-wide">Auto-tagged</span>
                                        </div>
                                        <button
                                            onClick={createPost}
                                            disabled={posting || (!newPostContent.trim() && selectedImages.length === 0)}
                                            className="h-10 px-5 rounded-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
                                        >
                                            {posting ? <Loader className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                                            {posting ? 'Posting...' : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-8 rounded-2xl p-4 bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 backdrop-blur">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <div className={`rounded-2xl p-10 text-center ${subtleCard}`}>
                            <div className="mb-5">
                                <MessageSquare className="h-14 w-14 mx-auto mb-5 text-teal-500/70" />
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">No posts yet</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                                    {filter === 'friends' ? 'Connect with people to see their posts in your feed.' : 'Share your first update and start building your presence.'}
                                </p>
                            </div>
                            {filter === 'me' && (
                                <button
                                    onClick={() => setShowCreatePost(true)}
                                    className="h-10 px-6 rounded-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white font-medium text-sm flex items-center gap-2 mx-auto shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <div key={post.id} className={`group rounded-2xl overflow-hidden ${subtleCard} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
                                <div className="p-6">
                                    <div className="flex items-start space-x-3">
                                        {/* User Avatar */}
                                        <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/60 dark:ring-slate-800/60 shadow">
                                            {post.profilePictureBase64 ? (
                                                <img
                                                    src={`data:image/jpeg;base64,${post.profilePictureBase64}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitials(post.profileName)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* User Info and Time */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                                        {post.profileName || 'Anonymous'}
                                                    </h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(post.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    {getAchievementIcon(post)}
                                                    <button className="text-slate-400 hover:text-slate-600">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <p className="text-slate-700 dark:text-slate-200 mb-4 leading-relaxed text-sm">
                                                {post.content}
                                            </p>

                                            {/* Post Images */}
                                            {post.hasImages && post.images && post.images.length > 0 && (
                                                <div className={`mb-4 grid gap-3 rounded-xl overflow-hidden ${post.images.length === 1 ? 'grid-cols-1' :
                                                    post.images.length === 2 ? 'grid-cols-2' :
                                                        post.images.length === 3 ? 'grid-cols-2' :
                                                            'grid-cols-2'
                                                    }`}>
                                                    {post.images.map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className={`relative cursor-pointer group/image ${post.images.length === 3 && index === 0 ? 'col-span-2' : ''
                                                                }`}
                                                            onClick={() => openImagePreview(image)}
                                                        >
                                                            <img
                                                                src={image}
                                                                alt={`Post image ${index + 1}`}
                                                                className="w-full h-56 object-cover transition-transform duration-300 group-hover/image:scale-[1.03] rounded-xl border border-teal-900/10 dark:border-slate-700/60"
                                                            />
                                                            <div className="absolute inset-0 bg-black/10 group-hover/image:bg-black/20 transition-colors duration-300 rounded-xl"></div>
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
                                                            className="px-2.5 py-1 bg-teal-600/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 border border-teal-600/20 dark:border-teal-400/30 rounded-full text-[10px] font-medium tracking-wide"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Engagement Bar */}
                                            <div className="flex items-center justify-start pt-4 border-t border-teal-900/10 dark:border-slate-700/60">
                                                <CelebrateButton
                                                    postId={post.id}
                                                    onCelebrationChange={handleCelebrationChange}
                                                />
                                            </div>

                                            {/* Reaction Count */}
                                            {(post.reactions?.length > 0) && (
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-teal-900/10 dark:border-slate-700/60">
                                                    <button
                                                        onClick={() => toggleReactions(post.id)}
                                                        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium tracking-wide"
                                                    >
                                                        <div className="flex items-center space-x-0.5">
                                                            <PartyPopper className="h-3 w-3 text-amber-500" />
                                                            <Sparkles className="h-3 w-3 text-purple-500" />
                                                        </div>
                                                        {post.reactions.length} celebrations
                                                    </button>
                                                </div>
                                            )}

                                            {/* Reactions List */}
                                            {showReactions[post.id] && post.reactions && post.reactions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-teal-900/10 dark:border-slate-700/60">
                                                    <h4 className="text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-400 mb-3 uppercase">Celebrated by</h4>
                                                    <div className="space-y-2">
                                                        {post.reactions.map((reaction, index) => (
                                                            <div key={index} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                                                                <div className="w-7 h-7 bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white/40 dark:ring-slate-800/50">
                                                                    {getInitials(reaction.userName)}
                                                                </div>
                                                                <span className="text-[11px] font-medium">{reaction.userName}</span>
                                                                <PartyPopper className="h-3 w-3 text-amber-500 ml-auto" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setImagePreviewModal({ show: false, image: null })}
                    >
                        <div className="relative max-w-5xl w-full max-h-full">
                            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-500/10 via-indigo-500/10 to-amber-500/10 rounded-2xl blur-xl" />
                            <img
                                src={imagePreviewModal.image}
                                alt="Preview"
                                className="max-w-full max-h-[80vh] w-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <button
                                onClick={() => setImagePreviewModal({ show: false, image: null })}
                                className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-colors shadow"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Celebrated Posts Modal */}
                {showCelebratedModal && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowCelebratedModal(false)}
                    >
                        <div
                            className="relative max-w-2xl w-full max-h-[80vh] bg-gradient-to-br from-teal-50/90 via-white/90 to-indigo-50/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-teal-100/50 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
                                        <PartyPopper className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Celebrated Posts</h2>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Posts you've celebrated</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCelebratedModal(false)}
                                    className="p-2 hover:bg-teal-100/50 dark:hover:bg-slate-700/50 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {Object.keys(celebratedPosts).filter(postId => celebratedPosts[postId]).length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
                                            <PartyPopper className="h-8 w-8 text-purple-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">No celebrated posts yet</h3>
                                        <p className="text-slate-600 dark:text-slate-400">Start celebrating posts to see them here!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {posts.filter(post => celebratedPosts[post.id]).map(post => (
                                            <div key={post.id} className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-teal-100/50 dark:border-slate-700/50">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden">
                                                        {post.profilePictureBase64 ? (
                                                            <img
                                                                src={`data:image/jpeg;base64,${post.profilePictureBase64}`}
                                                                alt="Profile"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                                                {getInitials(post.profileName)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                                            {post.profileName || 'Anonymous'}
                                                        </h4>
                                                        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 line-clamp-2">
                                                            {post.content}
                                                        </p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                                                            {formatDate(post.createdAt)}
                                                        </p>
                                                    </div>
                                                    <div className="text-purple-500">
                                                        <PartyPopper className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(MyFeedPage);
