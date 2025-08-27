'use client';
import { useState, useEffect } from 'react';
import { apiFetch, postServiceFetch } from '@/lib/api';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    GraduationCap,
    Briefcase,
    Award,
    BookOpen,
    Code,
    Loader2,
    Star,
    Clock,
    Building,
    School,
    ExternalLink
} from 'lucide-react';
import PostModal from '@/components/PostModal';
import EducationTimeline from '@/components/EducationTimeline';
import WorkTimeline from '@/components/WorkTimeline';

export default function CvViewer({ profileId }) {
    const [cvEntries, setCvEntries] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    useEffect(() => {
        if (!profileId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [cvRes, profileRes] = await Promise.all([
                    postServiceFetch(`/api/cv/entries/${profileId}`),
                    apiFetch(`/api/profile/${profileId}`),
                ]);

                if (!cvRes.ok || !profileRes.ok)
                    throw new Error('Failed to fetch data');

                const cvData = await cvRes.json();
                const profileData = await profileRes.json();

                setCvEntries(cvData);
                setProfile(profileData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profileId]);

    const groupedEntries = cvEntries.reduce((acc, entry) => {
        const type = entry.type?.toUpperCase() || 'OTHER';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entry);
        return acc;
    }, {});

    const handleCvHeadingClick = (entry) => {
        if (entry.postId) {
            setSelectedPost({
                postId: entry.postId,
                cvHeading: entry.content
            });
            setModalOpen(true);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-50 to-stone-100">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                        <div className="absolute inset-0 rounded-full border-2 border-sky-200 animate-pulse"></div>
                    </div>
                    <p className="text-slate-600 font-medium">Loading your professional profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-50 to-stone-100">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <Award className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Error loading CV</h3>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    // Extract skill entries and remove from main map
    const skillEntries = groupedEntries['SKILL'] || [];
    delete groupedEntries['SKILL'];

    const getIconForType = (type) => {
        switch (type.toLowerCase()) {
            case 'education': return <GraduationCap className="h-5 w-5 text-green-400" />;
            case 'experience': return <Briefcase className="h-5 w-5 text-blue-400" />;
            case 'project': return <Code className="h-5 w-5 text-purple-400" />;
            case 'achievement': return <Award className="h-5 w-5 text-yellow-400" />;
            default: return <BookOpen className="h-5 w-5 text-gray-400" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 bg-gradient-to-br from-slate-50 to-stone-100 min-h-screen">
            {/* Hero Section */}
            {profile && (
                <div className="relative overflow-hidden">
                    {/* Professional background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-stone-50 rounded-2xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-50/30 to-purple-50/30"></div>

                    <Card className="relative border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
                        <div className="relative">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-200/20 to-purple-200/20 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-200/20 to-rose-200/20 rounded-full translate-y-12 -translate-x-12"></div>

                            <CardHeader className="flex flex-row items-center gap-8 pb-8 relative z-10">
                                <div className="relative">
                                    <Avatar className="w-28 h-28 shadow-xl border-4 border-white ring-4 ring-sky-200/50">
                                        <AvatarImage
                                            src={
                                                profile.pictureBase64
                                                    ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                                    : undefined
                                            }
                                            alt="Profile"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-sky-500 to-purple-600 text-white">
                                            {profile.name?.slice(0, 2)?.toUpperCase() || 'NA'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                                            {profile.name || 'Name Not Available'}
                                        </h1>
                                        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                                            {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                        </p>
                                    </div>

                                    {/* Contact Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {profile.email && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50">
                                                <div className="w-9 h-9 bg-sky-100 rounded-lg flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-sky-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{profile.email}</p>
                                                    <p className="text-xs text-slate-500">Email</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.phoneNumber && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50">
                                                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <Phone className="h-4 w-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{profile.phoneNumber}</p>
                                                    <p className="text-xs text-slate-500">Phone</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.address && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50">
                                                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <MapPin className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{profile.address}</p>
                                                    <p className="text-xs text-slate-500">Location</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.birthDate && (
                                            <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl backdrop-blur-sm border border-slate-200/50">
                                                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <Calendar className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {new Date(profile.birthDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-slate-500">Birth Date</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </div>
                    </Card>
                </div>
            )}

            {/* Education Summary */}
            {(profile?.sscResult || profile?.hscResult || profile?.universityResult) && (
                <Card className="rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <School className="h-5 w-5 text-white" />
                            </div>
                            Education Summary
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-slate-200" />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.sscResult && (
                                <div className="group p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl border border-sky-200 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-sky-700 text-sm">SSC Result</h4>
                                    </div>
                                    <p className="text-sky-800 font-medium text-sm">{profile.sscResult}</p>
                                </div>
                            )}
                            {profile.hscResult && (
                                <div className="group p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-emerald-700 text-sm">HSC Result</h4>
                                    </div>
                                    <p className="text-emerald-800 font-medium text-sm">{profile.hscResult}</p>
                                </div>
                            )}
                            {profile.universityResult && (
                                <div className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-purple-700 text-sm">University Result</h4>
                                    </div>
                                    <p className="text-purple-800 font-medium text-sm">{profile.universityResult}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}


            <EducationTimeline/>

            {/* Work Experience Section */}
            <Card className="rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        Professional Experience
                    </CardTitle>
                </CardHeader>
                <Separator className="mb-4 bg-slate-200" />
                <CardContent>
                    <WorkTimeline userId={profileId} />
                </CardContent>
            </Card>
            {/* CV Sections */}
            {Object.entries(groupedEntries).map(([type, entries], index) => (
                <Card key={type} className="rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-slate-200 group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                {getIconForType(type)}
                            </div>
                            {type.toLowerCase().replace(/_/g, ' ')}
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-slate-200" />
                    <CardContent>
                        <div className="space-y-3">
                            {entries.map((entry, entryIndex) => (
                                <div
                                    key={entry.id}
                                    className={`p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-300 hover:border-sky-300 ${
                                        entry.postId ? 'cursor-pointer group/item' : ''
                                    }`}
                                    style={{
                                        animationDelay: `${entryIndex * 100}ms`
                                    }}
                                    onClick={() => entry.postId && handleCvHeadingClick(entry)}
                                >
                                    <div className="flex items-start justify-between">
                                        <p className="text-slate-700 leading-relaxed text-sm flex-1">
                                            {entry.content}
                                        </p>
                                        {entry.postId && (
                                            <div className="ml-3 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                                                <ExternalLink className="h-4 w-4 text-sky-500" />
                                            </div>
                                        )}
                                    </div>
                                    {entry.postId && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Click to view original post
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Skills Section */}
            {skillEntries.length > 0 && (
                <Card className="rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-slate-800">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <Code className="h-5 w-5 text-white" />
                            </div>
                            Skills & Technologies
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-slate-200" />
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skillEntries.flatMap((entry) =>
                                entry.content.split(',').map((skill, i) => (
                                    <Badge
                                        key={`${entry.id || 'entry'}-${skill.trim()}-${i}`}
                                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-100 to-purple-100 text-sky-700 border border-sky-200 hover:from-sky-200 hover:to-purple-200 transition-all duration-300 hover:scale-105 font-medium text-xs"
                                    >
                                        {skill.trim()}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No entries */}
            {cvEntries.length === 0 && (
                <Card className="rounded-xl border shadow-lg bg-white border-slate-200">
                    <CardContent className="py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sky-100 to-purple-100 rounded-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-sky-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">No CV entries found</h3>
                            <p className="text-slate-600 max-w-md mx-auto text-sm">
                                This profile doesn't have any CV entries yet. Start adding your professional experiences, projects, and achievements!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Post Modal */}
            {selectedPost && (
                <PostModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedPost(null);
                    }}
                    postId={selectedPost.postId}
                    cvHeading={selectedPost.cvHeading}
                />
            )}
        </div>
    );
}