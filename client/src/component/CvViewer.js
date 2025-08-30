'use client';
import { useState, useEffect, useMemo } from 'react';
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

// Design tokens (mirroring dashboard for consistency)
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';
const pillHeader = 'tracking-wide uppercase text-[11px] font-semibold px-3 py-1 rounded-full bg-white/60 dark:bg-slate-800/60 ring-1 ring-inset ring-white/50 dark:ring-slate-700/50 text-slate-600 dark:text-slate-300';

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

    // Group all entries by type (uppercased key) for non-skill sections
    const groupedEntries = useMemo(() => {
        return cvEntries.reduce((acc, entry) => {
            const rawType = entry.type || 'OTHER';
            const upper = rawType.toUpperCase();
            if (!acc[upper]) acc[upper] = [];
            acc[upper].push(entry);
            return acc;
        }, {});
    }, [cvEntries]);

    // Detect skill-like entries (supports SKILL, SKILLS, TECHNOLOGY, TECH_STACK etc.)
    const skillEntries = useMemo(() => (
        cvEntries.filter(e => /(skill|tech|stack)/i.test(e.type || ''))
    ), [cvEntries]);

    // Build non-skill grouped map (without mutating groupedEntries)
    const nonSkillGrouped = useMemo(() => {
        const clone = { ...groupedEntries };
        Object.keys(clone).forEach(k => {
            if (/(skill|tech|stack)/i.test(k)) delete clone[k];
        });
        return clone;
    }, [groupedEntries]);

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

    // (skillEntries & nonSkillGrouped already computed above)

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
            {/* Ambient background (mirrors dashboard) */}
            <div className="pointer-events-none select-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-10 h-[32rem] w-[32rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
            </div>

            {profile && (
                <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12 mb-10">
                    {/* Left Sidebar (stretched full height of CV viewer) */}
                    <div className={`relative rounded-2xl overflow-hidden ${gradientPanel} px-7 py-8 flex flex-col items-center text-center md:self-stretch`}>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-300/25 dark:bg-teal-500/10 blur-3xl" />
                            <div className="absolute bottom-0 right-0 w-56 h-56 bg-indigo-300/20 dark:bg-indigo-500/10 blur-3xl" />
                        </div>
                        <div className="relative group mb-6">
                            <Avatar className="w-36 h-36 ring-4 ring-white/70 dark:ring-slate-800 shadow-xl">
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
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                            {profile.name || 'Name Not Available'}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {profile.bio || 'Professional with a passion for excellence and innovation.'}
                        </p>
                        <Separator className="my-6 bg-gradient-to-r from-transparent via-slate-300/70 to-transparent dark:via-slate-600/60" />
                        <div className="space-y-5 w-full">
                            <div className="grid grid-cols-1 gap-3">
                                {profile.email && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50">
                                        <div className="h-9 w-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center"><Mail className="h-4 w-4" /></div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.email}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.phoneNumber && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50">
                                        <div className="h-9 w-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center"><Phone className="h-4 w-4" /></div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.phoneNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.address && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50">
                                        <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><MapPin className="h-4 w-4" /></div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{profile.address}</p>
                                        </div>
                                    </div>
                                )}
                                {profile.birthDate && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50">
                                        <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                                        <div className="min-w-0 text-left">
                                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Birth Date</p>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{new Date(profile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Skills (if any) */}
                            {skillEntries.length > 0 && (
                                <div className="text-left">
                                    <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-3">Skills</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skillEntries.flatMap((entry) =>
                                            entry.content.split(',').map((skill, i) => (
                                                <span
                                                    key={`${entry.id || 'entry'}-${skill.trim()}-${i}`}
                                                    className="px-2.5 py-1 rounded-full bg-teal-600/10 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300 border border-teal-600/20 dark:border-teal-400/30 text-[10px] font-medium tracking-wide"
                                                >
                                                    {skill.trim()}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main body */}
                    <div className="md:col-span-2 space-y-10">
                        {/* Education Summary */}
                        {(profile?.sscResult || profile?.hscResult || profile?.universityResult) && (
                            <Card className={`rounded-2xl ${subtleCard}`}>
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
                                            <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50">
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
                                            <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50">
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
                                            <div className="group p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50">
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

                        <div className="grid gap-10">
                            {/* Education Timeline */}
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm">
                                            <GraduationCap className="h-5 w-5" />
                                        </div>
                                        Academic Journey
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <EducationTimeline userId={profileId} />
                                </CardContent>
                            </Card>

                            {/* Work Experience Section */}
                            <Card className={`rounded-2xl ${subtleCard}`}>
                                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-300 to-sky-400 dark:from-sky-400 dark:to-sky-500 flex items-center justify-center text-white shadow-sm">
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        Professional Experience
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-2">
                                    <WorkTimeline userId={profileId} compact />
                                </CardContent>
                            </Card>

                            {/* Dynamic CV Sections */}
                            {Object.entries(nonSkillGrouped).map(([type, entries]) => (
                                <Card key={type} className={`rounded-2xl group ${subtleCard}`}>
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
                                                    className={`p-4 rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/50 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-all duration-300 ${entry.postId ? 'cursor-pointer group/item' : ''}`}
                                                    style={{ animationDelay: `${entryIndex * 60}ms` }}
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

                            {/* (Skills moved to sidebar) */}

                            {/* No entries */}
                            {cvEntries.length === 0 && (
                                <Card className={`rounded-2xl ${subtleCard}`}>
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
                        </div>
                    </div>
                </div>
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