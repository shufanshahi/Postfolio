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
import Navbar from "@/components/Navbar";

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
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-sky-200/50 animate-pulse"></div>
                        </div>
                        <p className="text-sky-600 font-medium text-lg">Loading profile...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center border border-red-300">
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading profile</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button 
                            onClick={() => router.back()}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </div>
                </div>
            </>
        );
    }

    if (!profile) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-600">Profile not found</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.back()}
                                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back
                                </Button>
                                <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
                            </div>
                            
                            {!isOwnProfile && (
                                <div className="flex items-center gap-3">
                                    <ConnectionButton targetUserId={userId} />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
                        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    {/* Avatar Section */}
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            <Avatar className="w-32 h-32 shadow-lg border-4 border-sky-400 ring-8 ring-sky-100">
                                                <AvatarImage
                                                    src={profile.pictureBase64 ? `data:image/jpeg;base64,${profile.pictureBase64}` : undefined}
                                                    alt="Profile"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-sky-500 to-sky-600 text-white">
                                                    {profile.name?.slice(0, 2)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-sky-400 rounded-full border-4 border-white flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                                {profile.name || 'Name Not Available'}
                                            </h1>
                                            <p className="text-lg text-gray-600 leading-relaxed">
                                                {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                            </p>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.email && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <Mail className="h-5 w-5 text-sky-600" />
                                                    <span className="text-gray-700">{profile.email}</span>
                                                </div>
                                            )}
                                            {profile.phoneNumber && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <Phone className="h-5 w-5 text-sky-600" />
                                                    <span className="text-gray-700">{profile.phoneNumber}</span>
                                                </div>
                                            )}
                                            {profile.address && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <MapPin className="h-5 w-5 text-sky-600" />
                                                    <span className="text-gray-700">{profile.address}</span>
                                                </div>
                                            )}
                                            {profile.birthDate && (
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                    <Calendar className="h-5 w-5 text-sky-600" />
                                                    <span className="text-gray-700">
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
                                                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-sky-600" />
                                                            <span className="text-sky-700 font-semibold">SSC</span>
                                                        </div>
                                                        <p className="text-gray-900 font-bold text-xl">{profile.sscResult}</p>
                                                    </div>
                                                )}
                                                {profile.hscResult && (
                                                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-sky-600" />
                                                            <span className="text-sky-700 font-semibold">HSC</span>
                                                        </div>
                                                        <p className="text-gray-900 font-bold text-xl">{profile.hscResult}</p>
                                                    </div>
                                                )}
                                                {profile.universityResult && (
                                                    <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <GraduationCap className="h-5 w-5 text-sky-600" />
                                                            <span className="text-sky-700 font-semibold">University</span>
                                                        </div>
                                                        <p className="text-gray-900 font-bold text-xl">{profile.universityResult}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'profile'
                                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                            }`}
                        >
                            <User className="h-4 w-4 inline mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'posts'
                                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                            }`}
                        >
                            <MessageSquare className="h-4 w-4 inline mr-2" />
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('cv')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'cv'
                                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
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
                            <Card className="bg-white border border-gray-200 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-gray-900">About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">
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
                            <Card className="bg-white border border-gray-200 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-gray-900 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-sky-600" />
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
        </>
    );
}