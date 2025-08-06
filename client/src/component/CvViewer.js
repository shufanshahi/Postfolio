'use client';
import { useState, useEffect } from 'react';
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
    School
} from 'lucide-react';

export default function CvViewer({ profileId }) {
    const [cvEntries, setCvEntries] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!profileId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');

                const [cvRes, profileRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/cv/entries/${profileId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:8080/api/profile/${profileId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                        <div className="absolute inset-0 rounded-full border-2 border-green-800 animate-pulse"></div>
                    </div>
                    <p className="text-gray-300 font-medium">Loading your professional profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-900/50 rounded-full flex items-center justify-center">
                        <Award className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Error loading CV</h3>
                    <p className="text-gray-400">{error}</p>
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
        <div className="max-w-6xl mx-auto py-12 px-6 space-y-12 bg-gray-900 min-h-screen">
            {/* Hero Section */}
            {profile && (
                <div className="relative overflow-hidden">
                    {/* Dark Duolingo-inspired background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-green-900/10 to-blue-900/10"></div>

                    <Card className="relative border-0 shadow-2xl bg-gray-800/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <div className="relative">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-600/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-600/10 to-pink-600/10 rounded-full translate-y-12 -translate-x-12"></div>

                            <CardHeader className="flex flex-row items-center gap-8 pb-8 relative z-10">
                                <div className="relative">
                                    <Avatar className="w-28 h-28 shadow-2xl border-4 border-gray-800 ring-4 ring-green-900/50">
                                        <AvatarImage
                                            src={
                                                profile.pictureBase64
                                                    ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                                    : undefined
                                            }
                                            alt="Profile"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                            {profile.name?.slice(0, 2)?.toUpperCase() || 'NA'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-gray-800 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                                            {profile.name || 'Name Not Available'}
                                        </h1>
                                        <p className="text-base text-gray-300 leading-relaxed max-w-2xl">
                                            {profile.bio || 'Professional with a passion for excellence and innovation.'}
                                        </p>
                                    </div>

                                    {/* Contact Information Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {profile.email && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-600/20">
                                                <div className="w-9 h-9 bg-green-900/50 rounded-lg flex items-center justify-center">
                                                    <Mail className="h-4 w-4 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{profile.email}</p>
                                                    <p className="text-xs text-gray-400">Email</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.phoneNumber && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-600/20">
                                                <div className="w-9 h-9 bg-blue-900/50 rounded-lg flex items-center justify-center">
                                                    <Phone className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{profile.phoneNumber}</p>
                                                    <p className="text-xs text-gray-400">Phone</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.address && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-600/20">
                                                <div className="w-9 h-9 bg-purple-900/50 rounded-lg flex items-center justify-center">
                                                    <MapPin className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{profile.address}</p>
                                                    <p className="text-xs text-gray-400">Location</p>
                                                </div>
                                            </div>
                                        )}
                                        {profile.birthDate && (
                                            <div className="flex items-center gap-3 p-3 bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-600/20">
                                                <div className="w-9 h-9 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                                                    <Calendar className="h-4 w-4 text-yellow-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">
                                                        {new Date(profile.birthDate).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-400">Birth Date</p>
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
                <Card className="rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <School className="h-5 w-5 text-white" />
                            </div>
                            Education Summary
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-gray-700" />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.sscResult && (
                                <div className="group p-4 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl border border-green-800 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-green-300 text-sm">SSC Result</h4>
                                    </div>
                                    <p className="text-green-200 font-medium text-sm">{profile.sscResult}</p>
                                </div>
                            )}
                            {profile.hscResult && (
                                <div className="group p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl border border-blue-800 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-blue-300 text-sm">HSC Result</h4>
                                    </div>
                                    <p className="text-blue-200 font-medium text-sm">{profile.hscResult}</p>
                                </div>
                            )}
                            {profile.universityResult && (
                                <div className="group p-4 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl border border-purple-800 hover:shadow-lg transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center">
                                            <Star className="h-3 w-3 text-white" />
                                        </div>
                                        <h4 className="font-semibold text-purple-300 text-sm">University Result</h4>
                                    </div>
                                    <p className="text-purple-200 font-medium text-sm">{profile.universityResult}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* CV Sections */}
            {Object.entries(groupedEntries).map(([type, entries], index) => (
                <Card key={type} className="rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-gray-800 border-gray-700 group">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                {getIconForType(type)}
                            </div>
                            {type.toLowerCase().replace(/_/g, ' ')}
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-gray-700" />
                    <CardContent>
                        <div className="space-y-3">
                            {entries.map((entry, entryIndex) => (
                                <div
                                    key={entry.id}
                                    className="p-4 bg-gradient-to-r from-gray-700/50 to-gray-800/50 rounded-lg border border-gray-700 hover:shadow-md transition-all duration-300 hover:border-green-500/30"
                                    style={{
                                        animationDelay: `${entryIndex * 100}ms`
                                    }}
                                >
                                    <p className="text-gray-200 leading-relaxed text-sm">{entry.content}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Skills Section */}
            {skillEntries.length > 0 && (
                <Card className="rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                                <Code className="h-5 w-5 text-white" />
                            </div>
                            Skills & Technologies
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-4 bg-gray-700" />
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skillEntries.flatMap((entry) =>
                                entry.content.split(',').map((skill, i) => (
                                    <Badge
                                        key={i}
                                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-green-900/50 to-teal-900/50 text-green-300 border border-green-800 hover:from-green-800/50 hover:to-teal-800/50 transition-all duration-300 hover:scale-105 font-medium text-xs"
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
                <Card className="rounded-2xl border shadow-lg bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <CardContent className="py-12">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-900/50 to-blue-900/50 rounded-full flex items-center justify-center">
                                <BookOpen className="h-8 w-8 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No CV entries found</h3>
                            <p className="text-gray-400 max-w-md mx-auto text-sm">
                                This profile doesn't have any CV entries yet. Start adding your professional experiences, projects, and achievements!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}