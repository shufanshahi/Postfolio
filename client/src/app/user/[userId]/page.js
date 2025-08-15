'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    GraduationCap, 
    FileText,
    Users,
    MessageSquare,
    Heart,
    Share2,
    MoreHorizontal,
    Loader2,
    AlertCircle
} from 'lucide-react';
import ConnectionButton from "@/components/ConnectionButton";
import UserPosts from "@/components/UserPosts";
import CvViewer from "@/component/CvViewer";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;
    
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'posts', 'cv'
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user's profile to check if this is their own profile
            const currentUserResponse = await apiFetch('/api/profile/me');
            
            if (currentUserResponse.ok) {
                const currentUser = await currentUserResponse.json();
                setIsOwnProfile(currentUser.id.toString() === userId);
            }

            // Get the target user's profile
            const response = await apiFetch(`/api/profile/${userId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('User not found');
                }
                throw new Error('Failed to fetch user profile');
            }

            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-200/20 animate-pulse"></div>
                    </div>
                    <p className="text-green-400 font-medium text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-900/50 rounded-full flex items-center justify-center border border-red-500/30">
                        <AlertCircle className="h-10 w-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error loading profile</h3>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Button 
                        onClick={() => router.back()}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-400">Profile not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.back()}
                                className="text-gray-300 hover:text-white hover:bg-gray-800"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-xl font-semibold text-white">Profile</h1>
                        </div>
                        
                        {!isOwnProfile && (
                            <div className="flex items-center gap-3">
                                <ConnectionButton targetUserId={userId} />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Hero Section */}
            <div className="relative py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden">
                        <div className="relative">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20"></div>
                            
                            <CardContent className="relative z-10 p-8">
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    {/* Avatar Section */}
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            <Avatar className="w-32 h-32 shadow-2xl border-4 border-green-400 ring-8 ring-green-400/20">
                                                <AvatarImage
                                                    src={profile.pictureBase64 ? `data:image/jpeg;base64,${profile.pictureBase64}` : undefined}
                                                    alt="Profile"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 to-green-600 text-white">
                                                    {profile.name?.slice(0, 2)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-gray-800 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                                                {profile.name || 'Name Not Available'}
                                            </h1>
                                            <p className="text-lg text-gray-300 leading-relaxed">
                                                {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                            </p>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.email && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                                                    <Mail className="h-5 w-5 text-green-400" />
                                                    <span className="text-gray-300">{profile.email}</span>
                                                </div>
                                            )}
                                            {profile.phoneNumber && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                                                    <Phone className="h-5 w-5 text-blue-400" />
                                                    <span className="text-gray-300">{profile.phoneNumber}</span>
                                                </div>
                                            )}
                                            {profile.address && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                                                    <MapPin className="h-5 w-5 text-purple-400" />
                                                    <span className="text-gray-300">{profile.address}</span>
                                                </div>
                                            )}
                                            {profile.birthDate && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-xl">
                                                    <Calendar className="h-5 w-5 text-orange-400" />
                                                    <span className="text-gray-300">
                                                        {new Date(profile.birthDate).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Education Summary */}
                                        {(profile.sscResult || profile.hscResult || profile.universityResult) && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {profile.sscResult && (
                                                    <div className="p-4 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl border border-green-500/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-green-400" />
                                                            <span className="text-green-400 font-semibold">SSC</span>
                                                        </div>
                                                        <p className="text-white font-bold text-xl">{profile.sscResult}</p>
                                                    </div>
                                                )}
                                                {profile.hscResult && (
                                                    <div className="p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl border border-blue-500/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-blue-400" />
                                                            <span className="text-blue-400 font-semibold">HSC</span>
                                                        </div>
                                                        <p className="text-white font-bold text-xl">{profile.hscResult}</p>
                                                    </div>
                                                )}
                                                {profile.universityResult && (
                                                    <div className="p-4 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl border border-purple-500/30">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-purple-400" />
                                                            <span className="text-purple-400 font-semibold">University</span>
                                                        </div>
                                                        <p className="text-white font-bold text-xl">{profile.universityResult}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            activeTab === 'profile'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                        <User className="h-4 w-4 inline mr-2" />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            activeTab === 'posts'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('cv')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            activeTab === 'cv'
                                ? 'bg-green-500 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" />
                        CV
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        {/* Additional profile information can go here */}
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-300 leading-relaxed">
                                    {profile.bio || 'No additional information available.'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'posts' && (
                    <UserPosts profileId={userId} />
                )}

                {activeTab === 'cv' && (
                    <div className="space-y-6">
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-green-400" />
                                    Professional CV
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CvViewer profileId={userId} />
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
} 