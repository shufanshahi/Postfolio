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
    School,
    Heart,
    Zap,
    Target
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
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-200/20 animate-pulse"></div>
                    </div>
                    <p className="text-green-400 font-medium text-lg">Loading your professional profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-red-900/50 rounded-full flex items-center justify-center border border-red-500/30">
                        <Award className="h-10 w-10 text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Error loading CV</h3>
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
            case 'education': return <GraduationCap className="h-5 w-5" />;
            case 'experience': return <Briefcase className="h-5 w-5" />;
            case 'project': return <Code className="h-5 w-5" />;
            case 'achievement': return <Award className="h-5 w-5" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Hero Section - Full Width */}
            {profile && (
                <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-blue-900/20 to-purple-900/20"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
                    
                    {/* Floating Elements */}
                    <div className="absolute top-20 left-20 w-32 h-32 bg-green-400/10 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-400/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-purple-400/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                    
                    <div className="relative z-10 text-center w-full max-w-7xl mx-auto px-6">
                        {/* Avatar */}
                        <div className="relative mb-8">
                            <Avatar className="w-40 h-40 shadow-2xl border-4 border-green-400 ring-8 ring-green-400/20 mx-auto">
                                <AvatarImage
                                    src={
                                        profile.pictureBase64
                                            ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                            : undefined
                                    }
                                    alt="Profile"
                                    className="object-cover"
                                />
                                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-green-500 to-green-600 text-white">
                                    {profile.name?.slice(0, 2)?.toUpperCase() || 'NA'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-gray-900 flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                            </div>
                        </div>
                        
                        {/* Name and Bio */}
                        <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                            {profile.name || 'Name Not Available'}
                        </h1>
                        <p className="text-xl text-gray-300 leading-relaxed max-w-4xl mx-auto mb-8">
                            {profile.bio || 'Professional with a passion for excellence and innovation.'}
                        </p>
                        
                        {/* Contact Information - Full Width Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
                            {profile.email && (
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-green-400/50 transition-all duration-300">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <Mail className="h-6 w-6 text-green-400" />
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">{profile.email}</p>
                                </div>
                            )}
                            {profile.phoneNumber && (
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-green-400/50 transition-all duration-300">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Phone className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">{profile.phoneNumber}</p>
                                </div>
                            )}
                            {profile.address && (
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-green-400/50 transition-all duration-300">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <MapPin className="h-6 w-6 text-purple-400" />
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">{profile.address}</p>
                                </div>
                            )}
                            {profile.birthDate && (
                                <div className="flex flex-col items-center gap-2 p-4 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 hover:border-green-400/50 transition-all duration-300">
                                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-orange-400" />
                                    </div>
                                    <p className="text-sm font-medium text-white text-center">
                                        {new Date(profile.birthDate).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                        <div className="w-6 h-10 border-2 border-green-400 rounded-full flex justify-center">
                            <div className="w-1 h-3 bg-green-400 rounded-full mt-2 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Sections - Full Width */}
            <div className="relative z-10 -mt-20 w-full">
                {/* Education Summary */}
                {(profile?.sscResult || profile?.hscResult || profile?.universityResult) && (
                    <div className="w-full px-6 mb-12">
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl max-w-7xl mx-auto">
                            <CardHeader className="text-center pb-8">
                                <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-white">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                                        <School className="h-8 w-8 text-white" />
                                    </div>
                                    Education Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {profile.sscResult && (
                                        <div className="group p-8 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-2xl border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                                    <Star className="h-6 w-6 text-white" />
                                                </div>
                                                <h4 className="font-bold text-green-400 text-lg">SSC Result</h4>
                                            </div>
                                            <p className="text-white font-bold text-2xl">{profile.sscResult}</p>
                                        </div>
                                    )}
                                    {profile.hscResult && (
                                        <div className="group p-8 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-2xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                                    <Star className="h-6 w-6 text-white" />
                                                </div>
                                                <h4 className="font-bold text-blue-400 text-lg">HSC Result</h4>
                                            </div>
                                            <p className="text-white font-bold text-2xl">{profile.hscResult}</p>
                                        </div>
                                    )}
                                    {profile.universityResult && (
                                        <div className="group p-8 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-2xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                                                    <Star className="h-6 w-6 text-white" />
                                                </div>
                                                <h4 className="font-bold text-purple-400 text-lg">University Result</h4>
                                            </div>
                                            <p className="text-white font-bold text-2xl">{profile.universityResult}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* CV Sections - Full Width */}
                {Object.entries(groupedEntries).map(([type, entries], index) => (
                    <div key={type} className="w-full px-6 mb-12">
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl max-w-7xl mx-auto group hover:border-green-400/50 transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {getIconForType(type)}
                                    </div>
                                    {type.toLowerCase().replace(/_/g, ' ')}
                                </CardTitle>
                            </CardHeader>
                            <Separator className="bg-gray-700/50 mb-6" />
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {entries.map((entry, entryIndex) => (
                                        <div 
                                            key={entry.id} 
                                            className="p-6 bg-gray-700/50 rounded-2xl border border-gray-600/50 hover:border-green-400/50 transition-all duration-300 hover:scale-105 group"
                                        >
                                            <p className="text-gray-200 leading-relaxed text-base group-hover:text-white transition-colors duration-300">{entry.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}

                {/* Skills Section - Full Width */}
                {skillEntries.length > 0 && (
                    <div className="w-full px-6 mb-12">
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl max-w-7xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-4 text-2xl font-bold text-white">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                                        <Code className="h-8 w-8 text-white" />
                                    </div>
                                    Skills & Technologies
                                </CardTitle>
                            </CardHeader>
                            <Separator className="bg-gray-700/50 mb-6" />
                            <CardContent>
                                <div className="flex flex-wrap gap-3">
                                    {skillEntries.flatMap((entry) =>
                                        entry.content.split(',').map((skill, i) => (
                                            <Badge
                                                key={i}
                                                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 font-medium text-base"
                                            >
                                                {skill.trim()}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* No entries */}
                {cvEntries.length === 0 && (
                    <div className="w-full px-6 mb-12">
                        <Card className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl shadow-2xl max-w-7xl mx-auto">
                            <CardContent className="py-20">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                                        <BookOpen className="h-12 w-12 text-green-400" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-white mb-4">No CV entries found</h3>
                                    <p className="text-gray-400 max-w-md mx-auto text-lg">
                                        This profile doesn't have any CV entries yet. Start adding your professional experiences, projects, and achievements!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
