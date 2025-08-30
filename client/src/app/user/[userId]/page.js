"use client";
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
    MoreHorizontal,
    AlertCircle
} from 'lucide-react';
import ConnectionButton from "@/components/ConnectionButton";
import FollowButton from "@/components/FollowButton";
import UserPosts from "@/components/UserPosts";
import CvViewer from "@/component/CvViewer";
import Navbar from "@/components/Navbar";

// Design tokens (kept local for now; could be centralized)
const subtleCard = 'bg-gradient-to-br from-teal-50/70 via-white/55 to-indigo-50/70 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 border border-teal-900/10 dark:border-slate-700/60 backdrop-blur-md shadow-sm';
const panelSurface = 'bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-teal-900/10 dark:border-slate-700/60';

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
                <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <div className="absolute -top-32 -left-16 w-[40rem] h-[40rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
                    </div>
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <div className="absolute inset-0 rounded-full border-2 border-teal-200/60 animate-pulse" />
                        </div>
                        <p className="text-teal-600 dark:text-teal-400 font-medium text-lg tracking-wide">Loading profile...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <div className="absolute -top-32 -left-16 w-[40rem] h-[40rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
                    </div>
                    <div className="text-center max-w-md px-6">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-400/30 flex items-center justify-center backdrop-blur">
                            <AlertCircle className="h-10 w-10 text-rose-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Error loading profile</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="rounded-full bg-white/70 dark:bg-slate-900/40 backdrop-blur border-teal-900/10 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900"
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
                <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-400">Profile not found</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 -z-10 select-none">
                    <div className="absolute -top-44 -left-24 w-[52rem] h-[52rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                    <div className="absolute top-1/3 -right-40 w-[46rem] h-[46rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
                </div>
                {/* Header */}
                <div className="backdrop-blur-md border-b border-teal-900/10 dark:border-slate-700/60 sticky top-0 z-20 bg-white/70 dark:bg-slate-900/40">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.back()}
                                className="rounded-full bg-white/70 dark:bg-slate-900/40 border-teal-900/10 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white hover:text-slate-800 dark:hover:text-slate-100"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Profile</h1>
                        </div>
                        {!isOwnProfile && (
                            <div className="flex items-center gap-2">
                                {profile.role === 'User' && (
                                    <ConnectionButton targetUserId={userId} targetUserName={profile.name} />
                                )}
                                {profile.role === 'Employer' && (
                                    <FollowButton targetUserId={userId} targetUserName={profile.name} userRole={profile.role} />
                                )}
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white/70 dark:hover:bg-slate-900/50">
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white/70 dark:hover:bg-slate-900/50">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Hero Section */}
                <div className="relative py-12 px-6">
                    <div className="max-w-4xl mx-auto">
                        <Card className={`${subtleCard} rounded-3xl overflow-hidden`}>
                            <CardContent className="p-8 md:p-10">
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    {/* Avatar Section */}
                                    <div className="flex-shrink-0">
                                        <div className="relative">
                                            <Avatar className="w-32 h-32 shadow-md border border-teal-400/50 dark:border-teal-500/30 rounded-full bg-white/40 dark:bg-slate-800/40">
                                                <AvatarImage
                                                    src={profile.pictureBase64 ? `data:image/jpeg;base64,${profile.pictureBase64}` : undefined}
                                                    alt="Profile"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white">
                                                    {profile.name?.slice(0, 2)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Removed glowing status badge */}
                                        </div>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
                                                {profile.name || 'Name Not Available'}
                                            </h1>
                                            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                            </p>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {profile.email && (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                    <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                                    <span className="text-slate-700 dark:text-slate-300">{profile.email}</span>
                                                </div>
                                            )}
                                            {profile.phoneNumber && (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                    <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                                    <span className="text-slate-700 dark:text-slate-300">{profile.phoneNumber}</span>
                                                </div>
                                            )}
                                            {profile.address && (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                    <MapPin className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                                    <span className="text-slate-700 dark:text-slate-300">{profile.address}</span>
                                                </div>
                                            )}
                                            {profile.birthDate && (
                                                <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                                    <span className="text-slate-700 dark:text-slate-300">
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
                                                    <div className="p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                        <div className="flex items-center gap-2 mb-2 text-teal-700 dark:text-teal-400">
                                                            <GraduationCap className="h-5 w-5" />
                                                            <span className="font-semibold uppercase tracking-wide text-xs">SSC</span>
                                                        </div>
                                                        <p className="text-slate-800 dark:text-slate-100 font-bold text-xl">{profile.sscResult}</p>
                                                    </div>
                                                )}
                                                {profile.hscResult && (
                                                    <div className="p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                        <div className="flex items-center gap-2 mb-2 text-teal-700 dark:text-teal-400">
                                                            <GraduationCap className="h-5 w-5" />
                                                            <span className="font-semibold uppercase tracking-wide text-xs">HSC</span>
                                                        </div>
                                                        <p className="text-slate-800 dark:text-slate-100 font-bold text-xl">{profile.hscResult}</p>
                                                    </div>
                                                )}
                                                {profile.universityResult && (
                                                    <div className="p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
                                                        <div className="flex items-center gap-2 mb-2 text-teal-700 dark:text-teal-400">
                                                            <GraduationCap className="h-5 w-5" />
                                                            <span className="font-semibold uppercase tracking-wide text-xs">University</span>
                                                        </div>
                                                        <p className="text-slate-800 dark:text-slate-100 font-bold text-xl">{profile.universityResult}</p>
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
                <div className="max-w-4xl mx-auto px-6 mb-10">
                    <div className="flex rounded-2xl p-1 bg-gradient-to-r from-teal-50/70 via-white/70 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur border border-teal-900/10 dark:border-slate-700/60 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 min-w-[120px] py-2.5 px-5 rounded-xl text-sm font-medium tracking-wide transition-all ring-1 ring-transparent ${activeTab === 'profile'
                                ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'} `}
                        >
                            <User className="h-4 w-4 inline mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`flex-1 min-w-[120px] py-2.5 px-5 rounded-xl text-sm font-medium tracking-wide transition-all ring-1 ring-transparent ${activeTab === 'posts'
                                ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'} `}
                        >
                            <MessageSquare className="h-4 w-4 inline mr-2" />
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab('cv')}
                            className={`flex-1 min-w-[120px] py-2.5 px-5 rounded-xl text-sm font-medium tracking-wide transition-all ring-1 ring-transparent ${activeTab === 'cv'
                                ? 'bg-white/70 dark:bg-slate-900/50 text-teal-700 dark:text-teal-300 shadow-sm ring-teal-500/30'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-900/30'} `}
                        >
                            <FileText className="h-4 w-4 inline mr-2" />
                            CV
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="max-w-4xl mx-auto px-6 pb-16">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <Card className={`${subtleCard} rounded-2xl`}>
                                <CardHeader>
                                    <CardTitle className="text-slate-800 dark:text-slate-100 text-base font-semibold tracking-wide flex items-center gap-2">About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
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
                            <Card className={`${subtleCard} rounded-2xl`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
                                        <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
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