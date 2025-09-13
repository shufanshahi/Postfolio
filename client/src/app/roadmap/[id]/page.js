"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import Navbar from '@/components/Navbar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
    Calendar,
    Clock,
    ArrowLeft,
    Loader2,
    CheckCircle,
    Circle,
    ExternalLink,
    PlayCircle,
    BookOpen,
    Coffee,
    Target,
    Users,
    RefreshCw,
    Trophy,
    TrendingUp,
    Award,
    Activity,
    Star
} from "lucide-react";

// Design tokens matching the dashboard theme
const gradientPanel = 'bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-sm';
const subtleCard = 'bg-gradient-to-br from-teal-50/65 via-white/55 to-indigo-50/60 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-800/70 backdrop-blur-md border border-teal-900/5 dark:border-slate-700/60 hover:border-teal-500/30 dark:hover:border-teal-400/30 transition-colors';

// Resource processing utilities
const isValidUrl = (string) => {
    try {
        new URL(string.startsWith('http') ? string : `https://${string}`);
        return true;
    } catch (_) {
        return false;
    }
};

const processResource = (resource) => {
    if (!resource || resource.trim() === '' || resource === '[]' || resource === 'null') {
        return null;
    }

    // Check if it's a valid URL
    if (isValidUrl(resource)) {
        // Special handling for YouTube URLs
        if (resource.toLowerCase().includes('youtube.com') || resource.toLowerCase().includes('youtu.be')) {
            // Try to extract video ID and show more descriptive text
            const videoId = resource.includes('v=') ? resource.split('v=')[1]?.split('&')[0] :
                resource.includes('youtu.be/') ? resource.split('youtu.be/')[1]?.split('?')[0] : null;

            return {
                type: 'youtube_url',
                text: videoId ? `YouTube Video (${videoId})` : 'YouTube Video',
                url: resource.startsWith('http') ? resource : `https://${resource}`,
                platform: 'YouTube',
                originalText: resource
            };
        }

        return {
            type: 'url',
            text: resource.length > 40 ? resource.substring(0, 40) + '...' : resource,
            url: resource.startsWith('http') ? resource : `https://${resource}`,
            originalText: resource
        };
    }

    // Check for formatted resources
    if (resource.toLowerCase().includes('youtube:') || resource.toLowerCase().includes('yt:')) {
        const videoTitle = resource.replace(/youtube:\s*/i, '').replace(/yt:\s*/i, '');
        return {
            type: 'youtube',
            text: videoTitle,
            platform: 'YouTube',
            originalText: resource
        };
    }

    if (resource.toLowerCase().includes('book:')) {
        const bookTitle = resource.replace(/book:\s*/i, '');
        return {
            type: 'book',
            text: bookTitle,
            platform: 'Book',
            originalText: resource
        };
    }

    if (resource.toLowerCase().includes('course:') || resource.toLowerCase().includes('coursera:') || resource.toLowerCase().includes('udemy:')) {
        const courseTitle = resource.replace(/course:\s*/i, '').replace(/coursera:\s*/i, '').replace(/udemy:\s*/i, '');
        const platform = resource.toLowerCase().includes('coursera') ? 'Coursera' :
            resource.toLowerCase().includes('udemy') ? 'Udemy' : 'Course';
        return {
            type: 'course',
            text: courseTitle,
            platform: platform,
            originalText: resource
        };
    }

    // Default case - treat as general resource
    return {
        type: 'general',
        text: resource,
        platform: 'Resource',
        originalText: resource
    };
};

// Helper functions for roadmap item types
const getItemTypeIcon = (itemType) => {
    switch (itemType) {
        case 'LEARN_TOPIC':
            return <BookOpen className="h-5 w-5" />;
        case 'REVISION':
            return <RefreshCw className="h-5 w-5" />;
        case 'PRACTICE':
            return <Activity className="h-5 w-5" />;
        case 'MOCK_INTERVIEW':
            return <Users className="h-5 w-5" />;
        case 'BREAK_DAY':
            return <Coffee className="h-5 w-5" />;
        case 'FINAL_REVIEW':
            return <Trophy className="h-5 w-5" />;
        default:
            return <BookOpen className="h-5 w-5" />;
    }
};

const getItemTypeColor = (itemType) => {
    switch (itemType) {
        case 'LEARN_TOPIC':
            return 'from-blue-400 to-blue-500';
        case 'REVISION':
            return 'from-amber-400 to-amber-500';
        case 'PRACTICE':
            return 'from-green-400 to-green-500';
        case 'MOCK_INTERVIEW':
            return 'from-violet-400 to-violet-500';
        case 'BREAK_DAY':
            return 'from-gray-400 to-gray-500';
        case 'FINAL_REVIEW':
            return 'from-purple-400 to-purple-500';
        default:
            return 'from-teal-400 to-teal-500';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const itemDate = new Date(dateString);
    return today.toDateString() === itemDate.toDateString();
};

const isPastDate = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const itemDate = new Date(dateString);
    return itemDate < today;
}; function RoadmapView() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const roadmapId = params.id;

    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingItem, setUpdatingItem] = useState(null);

    useEffect(() => {
        fetchRoadmap();
    }, [roadmapId]);

    const fetchRoadmap = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // First get user profile to get profile ID
            const profileRes = await fetch('http://localhost:8080/api/profile/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!profileRes.ok) {
                setError("Failed to get user profile");
                return;
            }

            const profile = await profileRes.json();

            // Since we don't have direct roadmap ID endpoint, we need to find it differently
            // Let's get all roadmaps for this profile and find the one with matching ID
            const roadmapsRes = await fetch(`http://localhost:8080/api/roadmaps/profile/${profile.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (roadmapsRes.ok) {
                const roadmaps = await roadmapsRes.json();
                const targetRoadmap = roadmaps.find(r => r.id.toString() === roadmapId);

                if (targetRoadmap) {
                    setRoadmap(targetRoadmap);
                } else {
                    setError("Roadmap not found");
                }
            } else {
                setError("Failed to load roadmaps");
            }
        } catch (err) {
            console.error("Error fetching roadmap:", err);
            setError("Error loading roadmap");
        } finally {
            setLoading(false);
        }
    };

    const handleItemComplete = async (itemId, isCompleted) => {
        setUpdatingItem(itemId);
        try {
            const token = localStorage.getItem("token");
            const url = `http://localhost:8080/api/roadmaps/${roadmapId}/items/${itemId}/complete`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    completionNotes: isCompleted ? "Completed" : ""
                })
            });

            if (response.ok) {
                // Refresh roadmap data
                fetchRoadmap();
            } else {
                alert("Failed to update item status");
            }
        } catch (error) {
            console.error("Error updating item:", error);
            alert("Error updating item status");
        } finally {
            setUpdatingItem(null);
        }
    };

    const getItemTypeIcon = (type) => {
        switch (type) {
            case 'LEARN_TOPIC':
                return <BookOpen className="h-5 w-5" />;
            case 'PRACTICE':
                return <Target className="h-5 w-5" />;
            case 'REVISION':
                return <RefreshCw className="h-5 w-5" />;
            case 'MOCK_INTERVIEW':
                return <Users className="h-5 w-5" />;
            case 'BREAK_DAY':
                return <Coffee className="h-5 w-5" />;
            case 'FINAL_REVIEW':
                return <Trophy className="h-5 w-5" />;
            default:
                return <Circle className="h-5 w-5" />;
        }
    };

    const getItemTypeColor = (type) => {
        switch (type) {
            case 'LEARN_TOPIC':
                return 'from-sky-400 to-sky-500';
            case 'PRACTICE':
                return 'from-teal-400 to-teal-500';
            case 'REVISION':
                return 'from-amber-400 to-amber-500';
            case 'MOCK_INTERVIEW':
                return 'from-indigo-400 to-indigo-500';
            case 'BREAK_DAY':
                return 'from-slate-400 to-slate-500';
            case 'FINAL_REVIEW':
                return 'from-rose-400 to-rose-500';
            default:
                return 'from-slate-400 to-slate-500';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isToday = (dateString) => {
        const today = new Date();
        const itemDate = new Date(dateString);
        return today.toDateString() === itemDate.toDateString();
    };

    const isPastDate = (dateString) => {
        const today = new Date();
        const itemDate = new Date(dateString);
        today.setHours(0, 0, 0, 0);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate < today;
    };

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,theme(colors.teal.100)_0%,theme(colors.teal.50)_35%,theme(colors.white)_70%)] dark:bg-[radial-gradient(circle_at_30%_20%,oklch(0.3_0.05_210)_0%,oklch(0.22_0.025_250)_60%)]">
                <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
                    <div className="absolute top-10 left-1/4 h-64 w-64 bg-teal-300/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-1/4 h-72 w-72 bg-indigo-300/30 rounded-full blur-3xl animate-pulse [animation-delay:200ms]" />
                </div>
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading your learning roadmap...</p>
                </div>
            </div>
        );
    }

    if (error || !roadmap) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="pointer-events-none select-none absolute inset-0 -z-10">
                    <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                </div>
                <Navbar />
                <div className="max-w-6xl mx-auto py-10 px-6">
                    <div className="text-center">
                        <div className={`max-w-md mx-auto p-6 rounded-2xl ${subtleCard}`}>
                            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Roadmap Not Found</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">{error || "The roadmap you're looking for doesn't exist."}</p>
                            <Button onClick={() => router.push('/my-interviews')} className="bg-teal-600 hover:bg-teal-700 text-white">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Interviews
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background decoration matching dashboard */}
            <div className="pointer-events-none select-none absolute inset-0 -z-10">
                <div className="absolute -top-24 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-100 to-white dark:from-teal-600/30 dark:via-indigo-600/20 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute top-1/3 -right-32 h-[34rem] w-[34rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
            </div>

            <Navbar />

            <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4 mb-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/my-interviews')}
                                className="rounded-full border-slate-300/60 bg-white/60 backdrop-blur hover:bg-white shadow-sm text-slate-700"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Interviews
                            </Button>
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-indigo-700 to-amber-600 dark:from-teal-200 dark:via-indigo-200 dark:to-amber-200">
                            {roadmap.title}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                            {roadmap.description}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Interview Date: <span className="font-medium text-slate-700 dark:text-slate-200">{formatDate(roadmap.interviewDate)}</span>
                        </p>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className={subtleCard}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-sky-400 to-sky-500 text-white">
                                    <Target className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent">
                                        {roadmap.totalItems}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Items</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={subtleCard}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 text-white">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                                        {roadmap.completedItems}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={subtleCard}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-white">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                                        {roadmap.totalItems - roadmap.completedItems}
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Remaining</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={subtleCard}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 text-white">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                                        {Math.round(roadmap.completionPercentage)}%
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Progress</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <Card className={subtleCard}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                <span className="text-lg font-semibold bg-gradient-to-r from-teal-700 to-indigo-600 bg-clip-text text-transparent">Overall Progress</span>
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                                {Math.round(roadmap.completionPercentage)}%
                            </span>
                        </div>
                        <div className="relative">
                            <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-4 bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                    style={{ width: `${roadmap.completionPercentage}%` }}
                                >
                                    <div className="h-full w-full bg-gradient-to-r from-white/20 to-transparent" />
                                </div>
                            </div>
                            <div className="absolute inset-0 rounded-full ring-1 ring-slate-900/10 dark:ring-white/10" />
                        </div>
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-2">
                            <span>{roadmap.completedItems} completed</span>
                            <span>{roadmap.totalItems - roadmap.completedItems} remaining</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Roadmap Items */}
                <Card className={subtleCard}>
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-teal-700 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-teal-600" />
                            Learning Roadmap
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                            Your personalized day-by-day preparation plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">{roadmap.roadmapItems?.map((item, index) => (
                            <div
                                key={item.id}
                                className={`relative group transition-all duration-300 ${item.isCompleted
                                    ? `${subtleCard} ring-2 ring-teal-500/30 shadow-lg shadow-teal-500/10`
                                    : isToday(item.dayDate)
                                        ? `${subtleCard} ring-2 ring-sky-500/40 shadow-lg shadow-sky-500/10`
                                        : isPastDate(item.dayDate)
                                            ? `${subtleCard} ring-1 ring-slate-300/30 opacity-75`
                                            : subtleCard
                                    } p-6 rounded-2xl hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-white/5`}
                            >
                                {/* Timeline connector */}
                                {index < roadmap.roadmapItems.length - 1 && (
                                    <div className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-600" />
                                )}

                                <div className="flex items-start gap-6">
                                    {/* Completion Checkbox */}
                                    <div className="flex-shrink-0 pt-1">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                checked={item.isCompleted}
                                                onCheckedChange={(checked) => handleItemComplete(item.id, checked)}
                                                disabled={updatingItem === item.id}
                                                className="border-slate-400 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                                            />
                                            {updatingItem === item.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Type Icon */}
                                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${getItemTypeColor(item.itemType)} text-white shadow-lg flex-shrink-0`}>
                                        {getItemTypeIcon(item.itemType)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className={`text-xl font-semibold mb-2 transition-colors ${item.isCompleted
                                                    ? 'text-teal-700 dark:text-teal-300'
                                                    : 'text-slate-800 dark:text-slate-100'
                                                    }`}>
                                                    {item.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mb-3">
                                                    {isToday(item.dayDate) && (
                                                        <Badge className="bg-gradient-to-r from-sky-500 to-sky-600 text-white border-0 shadow-lg">
                                                            <Star className="h-3 w-3 mr-1" />
                                                            Today
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="border-slate-300 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50">
                                                        <Calendar className="h-3 w-3 mr-1" />
                                                        {formatDate(item.dayDate)}
                                                    </Badge>
                                                    <Badge className={`bg-gradient-to-r ${getItemTypeColor(item.itemType)} text-white border-0`}>
                                                        {item.itemType.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{item.description}</p>

                                        {item.estimatedHours && (
                                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-full px-4 py-2 w-fit">
                                                <Clock className="h-4 w-4 mr-2" />
                                                Estimated: {item.estimatedHours} hours
                                            </div>
                                        )}

                                        {/* Resources */}
                                        {(item.videoLinks?.length > 0 || item.websiteLinks?.length > 0 || item.resourceLinks?.length > 0) && (
                                            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4">
                                                {item.videoLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                                            <PlayCircle className="h-4 w-4 mr-2 text-red-500" />
                                                            Video Resources
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.videoLinks
                                                                .map(link => processResource(link))
                                                                .filter(resource => resource !== null)
                                                                .map((resource, idx) => (
                                                                    <Button
                                                                        key={idx}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => resource.url ? window.open(resource.url, '_blank') : null}
                                                                        className={`${resource.url ? 'cursor-pointer' : 'cursor-default'} bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/30`}
                                                                        disabled={!resource.url}
                                                                    >
                                                                        <PlayCircle className="h-3 w-3 mr-1" />
                                                                        {resource.type === 'youtube_url' || resource.type === 'youtube' ? resource.text :
                                                                            resource.type === 'url' ? 'Visit' : resource.text}
                                                                        {resource.platform && (resource.type === 'youtube_url' || (resource.platform && resource.type !== 'url')) && (
                                                                            <span className="text-xs opacity-75 ml-1">({resource.platform})</span>
                                                                        )}
                                                                    </Button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.websiteLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                                            <ExternalLink className="h-4 w-4 mr-2 text-sky-500" />
                                                            Web Resources
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.websiteLinks
                                                                .map(link => processResource(link))
                                                                .filter(resource => resource !== null)
                                                                .map((resource, idx) => (
                                                                    <Button
                                                                        key={idx}
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => resource.url ? window.open(resource.url, '_blank') : null}
                                                                        className={`${resource.url ? 'cursor-pointer' : 'cursor-default'} bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:border-sky-700/50 dark:text-sky-300 dark:hover:bg-sky-900/30`}
                                                                        disabled={!resource.url}
                                                                    >
                                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                                        {resource.type === 'url' ? 'Visit' : resource.text}
                                                                        {resource.platform && resource.type !== 'url' && (
                                                                            <span className="text-xs opacity-75 ml-1">({resource.platform})</span>
                                                                        )}
                                                                    </Button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.resourceLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                                            <BookOpen className="h-4 w-4 mr-2 text-teal-500" />
                                                            Learning Materials
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.resourceLinks
                                                                .map(resource => processResource(resource))
                                                                .filter(resource => resource !== null)
                                                                .map((resource, idx) => (
                                                                    <Badge
                                                                        key={idx}
                                                                        variant="outline"
                                                                        className={`${resource.url ? 'cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30' : ''} bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/20 dark:border-teal-700/50 dark:text-teal-300`}
                                                                        onClick={() => resource.url ? window.open(resource.url, '_blank') : null}
                                                                    >
                                                                        <BookOpen className="h-3 w-3 mr-1" />
                                                                        {resource.text}
                                                                        {resource.platform && resource.type !== 'url' && (
                                                                            <span className="text-xs opacity-75 ml-1">({resource.platform})</span>
                                                                        )}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Special handling for Mock Interview items */}
                                        {item.itemType === 'MOCK_INTERVIEW' && (
                                            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                                        <Users className="h-4 w-4 mr-2 text-violet-500" />
                                                        Mock Interview Practice
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => router.push('/mockInterview')}
                                                            className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/20 dark:border-violet-700/50 dark:text-violet-300 dark:hover:bg-violet-900/30"
                                                        >
                                                            <Users className="h-3 w-3 mr-1" />
                                                            Start Mock Interview
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {item.isCompleted && item.completionNotes && (
                                            <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200/50 dark:border-teal-700/30">
                                                <p className="text-teal-700 dark:text-teal-300 text-sm flex items-start gap-2">
                                                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span>{item.completionNotes}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default withAuth(RoadmapView);
