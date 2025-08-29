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
        <div className="relative">
            {profile && (
                <div className="relative rounded-3xl overflow-hidden border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/70 via-white/60 to-indigo-50/60 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/50 backdrop-blur-xl shadow-lg">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-10 -left-10 w-56 h-56 bg-teal-300/20 dark:bg-teal-500/10 blur-3xl" />
                        <div className="absolute top-1/2 -right-10 w-64 h-64 bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
                    </div>
                    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-10 relative">
                        <div className="shrink-0">
                            <div className="relative group">
                                <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-white/70 dark:ring-slate-800 shadow-xl">
                                    <AvatarImage
                                        src={profile.pictureBase64 ? `data:image/jpeg;base64,${profile.pictureBase64}` : undefined}
                                        alt="Profile"
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 text-white">
                                        {profile.name?.slice(0, 2)?.toUpperCase() || 'NA'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-3 -right-3 bg-teal-600 text-white text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">Active</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                                        {profile.name || 'Name Not Available'}
                                    </h1>
                                    <p className="mt-3 text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">
                                        {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {profile.email && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-teal-50/70 via-white/60 to-white/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/30 border border-teal-900/10 dark:border-slate-700/60">
                                            <div className="h-9 w-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                                                <Mail className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.phoneNumber && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-teal-50/70 via-white/60 to-white/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/30 border border-teal-900/10 dark:border-slate-700/60">
                                            <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.phoneNumber}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.address && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-teal-50/70 via-white/60 to-white/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/30 border border-teal-900/10 dark:border-slate-700/60">
                                            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Location</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.address}</p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.birthDate && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-teal-50/70 via-white/60 to-white/40 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/30 border border-teal-900/10 dark:border-slate-700/60">
                                            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Birth Date</p>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{new Date(profile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Education Summary */}
            {(profile?.sscResult || profile?.hscResult || profile?.universityResult) && (
                <Card className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm">
                                <School className="h-5 w-5" />
                            </div>
                            Education Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.sscResult && (
                                <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-teal-50/80 via-white/70 to-white/60 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 rounded-lg flex items-center justify-center text-white">
                                            <Star className="h-3 w-3" />
                                        </div>
                                        <h4 className="font-medium text-teal-700 dark:text-teal-300 text-xs uppercase tracking-wide">SSC</h4>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-medium text-sm">{profile.sscResult}</p>
                                </div>
                            )}
                            {profile.hscResult && (
                                <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-indigo-50/80 via-white/70 to-white/60 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 rounded-lg flex items-center justify-center text-white">
                                            <Star className="h-3 w-3" />
                                        </div>
                                        <h4 className="font-medium text-indigo-700 dark:text-indigo-300 text-xs uppercase tracking-wide">HSC</h4>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-medium text-sm">{profile.hscResult}</p>
                                </div>
                            )}
                            {profile.universityResult && (
                                <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-amber-50/80 via-white/70 to-white/60 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/40">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 rounded-lg flex items-center justify-center text-white">
                                            <Star className="h-3 w-3" />
                                        </div>
                                        <h4 className="font-medium text-amber-700 dark:text-amber-300 text-xs uppercase tracking-wide">University</h4>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-medium text-sm">{profile.universityResult}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}


            <EducationTimeline />

            {/* Work Experience Section */}
            <Card className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        Professional Experience
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <WorkTimeline userId={profileId} />
                </CardContent>
            </Card>
            {/* CV Sections */}
            {Object.entries(groupedEntries).map(([type, entries], index) => (
                <Card key={type} className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md group">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                                {getIconForType(type)}
                            </div>
                            {type.toLowerCase().replace(/_/g, ' ')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            {entries.map((entry, entryIndex) => (
                                <div
                                    key={entry.id}
                                    className={`p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-r from-teal-50/70 via-white/60 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/30 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-all duration-300 ${entry.postId ? 'cursor-pointer group/item' : ''}`}
                                    style={{ animationDelay: `${entryIndex * 80}ms` }}
                                    onClick={() => entry.postId && handleCvHeadingClick(entry)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm flex-1">
                                            {entry.content}
                                        </p>
                                        {entry.postId && (
                                            <div className="flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
                                                <ExternalLink className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                            </div>
                                        )}
                                    </div>
                                    {entry.postId && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Click to view original post</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Skills Section */}
            {skillEntries.length > 0 && (
                <Card className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm">
                                <Code className="h-5 w-5" />
                            </div>
                            Skills & Technologies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                            {skillEntries.flatMap((entry) =>
                                entry.content.split(',').map((skill, i) => (
                                    <Badge
                                        key={`${entry.id || 'entry'}-${skill.trim()}-${i}`}
                                        className="px-3 py-1.5 rounded-full bg-teal-600/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 border border-teal-600/20 dark:border-teal-400/30 hover:bg-teal-600/15 dark:hover:bg-teal-400/20 transition-colors text-[11px] font-medium tracking-wide"
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
                <Card className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/50 backdrop-blur-xl shadow-md">
                    <CardContent className="py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 text-white shadow">
                                <BookOpen className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">No CV entries found</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-sm">
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