'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    AlertCircle
} from 'lucide-react';

export default function MyFeedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('friends'); // 'friends', 'me'
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [profileId, setProfileId] = useState(null);

    useEffect(() => {
        // First fetch the profile ID
        fetchProfileId();
    }, []);

    useEffect(() => {
        // Then fetch posts when profileId is available
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

            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }

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
            if (filter === 'me') {
                url = `/api/posts/profile/${profileId}`;
            }

            const response = await fetch(`http://localhost:8080${url}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch feed');
            }

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
                    profileId: profileId // Use the fetched profile ID
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create post');
            }

            setNewPostContent('');
            setShowCreatePost(false);
            fetchFeed(); // Refresh the feed
        } catch (err) {
            setError(err.message);
        } finally {
            setPosting(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Home className="h-8 w-8 text-purple-400" />
                            <h1 className="text-3xl font-bold text-white">My Feed</h1>
                        </div>
                        <Button 
                            onClick={() => setShowCreatePost(!showCreatePost)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                        </Button>
                    </div>

                    {/* Filter Tabs - Only Friends and Me */}
                    <div className="flex space-x-2 mb-6">
                        <Button
                            onClick={() => setFilter('friends')}
                            variant={filter === 'friends' ? 'default' : 'outline'}
                            className={filter === 'friends' ? 'bg-purple-600 hover:bg-purple-700' : 'text-white border-gray-600 hover:bg-gray-800'}
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Friends & Me
                        </Button>
                        <Button
                            onClick={() => setFilter('me')}
                            variant={filter === 'me' ? 'default' : 'outline'}
                            className={filter === 'me' ? 'bg-purple-600 hover:bg-purple-700' : 'text-white border-gray-600 hover:bg-gray-800'}
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
                                        <AvatarFallback className="bg-purple-600 text-white">
                                            U
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea
                                            placeholder="What's on your mind?"
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            className="min-h-[100px] bg-gray-700 border-gray-600 text-white placeholder-gray-400 resize-none"
                                        />
                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex space-x-2">
                                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                                    Auto-tagged
                                                </Badge>
                                            </div>
                                            <Button 
                                                onClick={createPost}
                                                disabled={posting || !newPostContent.trim()}
                                                className="bg-purple-600 hover:bg-purple-700 text-white"
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
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                                    <p className="text-gray-400">
                                        {filter === 'friends' && 'Connect with people to see their posts in your feed!'}
                                        {filter === 'me' && 'Create your first post to get started!'}
                                    </p>
                                </div>
                                {filter === 'me' && (
                                    <Button 
                                        onClick={() => setShowCreatePost(true)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Post
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        posts.map((post) => (
                            <Card key={post.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex items-start space-x-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={post.profilePictureBase64} />
                                            <AvatarFallback className="bg-purple-600 text-white">
                                                {getInitials(post.profileName || 'User')}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-semibold text-white">
                                                        {post.profileName || 'Anonymous'}
                                                    </h3>
                                                    {post.autoTagged && (
                                                        <Badge variant="secondary" className="bg-green-900/20 text-green-400 border-green-500">
                                                            AI Tagged
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2 text-gray-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm">{formatDate(post.createdAt)}</span>
                                                    <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-white" />
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-300 mb-4 leading-relaxed">
                                                {post.content}
                                            </p>
                                            
                                            {post.tags && post.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {post.tags.map((tag, index) => (
                                                        <Badge 
                                                            key={index} 
                                                            variant="outline" 
                                                            className="bg-purple-900/20 text-purple-400 border-purple-500"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                                <div className="flex items-center space-x-6">
                                                    <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                                                        <Heart className="h-5 w-5" />
                                                        <span className="text-sm">Like</span>
                                                    </button>
                                                    <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                                                        <MessageSquare className="h-5 w-5" />
                                                        <span className="text-sm">Comment</span>
                                                    </button>
                                                    <button className="flex items-center space-x-2 text-gray-400 hover:text-purple-400 transition-colors">
                                                        <Share2 className="h-5 w-5" />
                                                        <span className="text-sm">Share</span>
                                                    </button>
                                                </div>
                                                
                                                {post.type && (
                                                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                                                        {post.type}
                                                    </Badge>
                                                )}
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