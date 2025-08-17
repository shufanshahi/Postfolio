'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    Home,
    User,
    MessageSquare,
    Heart,
    Share2,
    MoreHorizontal,
    Send,
    Filter,
    Plus,
    Users,
    Clock,
    TrendingUp,
    Loader2,
    AlertCircle,
    PartyPopper,
    Sparkles,
    Trophy,
    Flame,
    Star,
    Zap
} from 'lucide-react';

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

    const createPost = async () => {
        if (!newPostContent.trim()) return;

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
                    content: newPostContent,
                    profileId: profileId
                })
            });

            if (!response.ok) throw new Error('Failed to create post');
            setNewPostContent('');
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Home className="h-8 w-8 text-green-400" />
                            <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                                My Feed
                            </h1>
                        </div>
                        <Button
                            onClick={() => setShowCreatePost(!showCreatePost)}
                            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                        </Button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-2 mb-6 bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <Button
                            onClick={() => setFilter('friends')}
                            variant={filter === 'friends' ? 'default' : 'ghost'}
                            className={`flex-1 ${filter === 'friends' ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Friends & Me
                        </Button>
                        <Button
                            onClick={() => setFilter('me')}
                            variant={filter === 'me' ? 'default' : 'ghost'}
                            className={`flex-1 ${filter === 'me' ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <User className="h-4 w-4 mr-2" />
                            My Posts
                        </Button>
                    </div>

                    {/* Create Post Section */}
                    {showCreatePost && (
                        <Card className="mb-6 bg-gray-800 border-gray-700">
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                            {getInitials('User')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea
                                            placeholder="What's on your mind?"
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus-visible:ring-green-500 resize-none"
                                        />
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex space-x-2">
                                                <Badge className="bg-gradient-to-r from-green-900/50 to-blue-900/50 text-green-300 border-green-800">
                                                    Auto-tagged
                                                </Badge>
                                            </div>
                                            <Button
                                                onClick={createPost}
                                                disabled={posting || !newPostContent.trim()}
                                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                                            >
                                                {posting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Send className="h-4 w-4 mr-2" />
                                                )}
                                                Post
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="mb-6 bg-red-900/20 border-red-500">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                <span>{error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Posts Feed */}
                <div className="space-y-6">
                    {posts.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="p-8 text-center">
                                <div className="text-gray-400 mb-4">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                                    <p className="text-gray-400">
                                        {filter === 'friends' ? 'Connect with people to see their posts in your feed!' : 'Create your first post to get started!'}
                                    </p>
                                </div>
                                {filter === 'me' && (
                                    <Button
                                        onClick={() => setShowCreatePost(true)}
                                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Post
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        posts.map((post) => (
                            <Card key={post.id} className="bg-gray-800 border-gray-700 hover:border-green-500/30 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start space-x-4">
                                        {/* User Avatar */}
                                        <Avatar className="h-12 w-12">
                                            {post.profilePictureBase64 ? (
                                                <AvatarImage src={`data:image/jpeg;base64,${post.profilePictureBase64}`} />
                                            ) : (
                                                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                                    {getInitials(post.profileName)}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>

                                        <div className="flex-1">
                                            {/* User Info and Time */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-white text-lg">
                                                        {post.profileName || 'Anonymous'}
                                                    </h3>
                                                    <p className="text-gray-400 text-sm">{formatDate(post.createdAt)}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getAchievementIcon(post)}
                                                </div>
                                            </div>

                                            {/* Post Content */}
                                            <p className="text-gray-300 mb-4 leading-relaxed text-lg">
                                                {post.content}
                                            </p>

                                            {/* Tags */}
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {post.tags.map((tag, index) => (
                                                        <Badge
                                                            key={index}
                                                            className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 text-purple-300 border-purple-800"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Celebrate Button */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                                <Button
                                                    onClick={() => handleCelebrate(post.id)}
                                                    variant="ghost"
                                                    className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center space-x-1">
                                                            <PartyPopper className="h-4 w-4 text-yellow-400" />
                                                            <Sparkles className="h-3 w-3 text-pink-400" />
                                                        </div>
                                                        <span>CELEBRATE</span>
                                                    </div>
                                                </Button>

                                                {/* Reaction Count */}
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleReactions(post.id)}>
                                                        <div className="flex items-center space-x-1">
                                                            <PartyPopper className="h-4 w-4 text-yellow-400" />
                                                            <Sparkles className="h-3 w-3 text-pink-400" />
                                                        </div>
                                                        <span className="text-gray-400 text-sm">
                                                            {post.reactions?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reactions List */}
                                            {showReactions[post.id] && post.reactions && post.reactions.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-700">
                                                    <h4 className="text-sm font-medium text-gray-400 mb-2">Celebrations:</h4>
                                                    <div className="space-y-2">
                                                        {post.reactions.map((reaction, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs">
                                                                        {getInitials(reaction.userName)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm text-gray-300">{reaction.userName}</span>
                                                                <span className="text-xs text-gray-500">celebrated</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Comment Input */}
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs">
                                                            {getInitials('You')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}