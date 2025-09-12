"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import withAuth from '@/components/withAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
    Trophy
} from "lucide-react";

function RoadmapView() {
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
                return 'bg-blue-600';
            case 'PRACTICE':
                return 'bg-green-600';
            case 'REVISION':
                return 'bg-yellow-600';
            case 'MOCK_INTERVIEW':
                return 'bg-purple-600';
            case 'BREAK_DAY':
                return 'bg-gray-600';
            case 'FINAL_REVIEW':
                return 'bg-red-600';
            default:
                return 'bg-gray-600';
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
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                        <span className="ml-2 text-white">Loading roadmap...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !roadmap) {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-red-400 text-center mb-4">{error || "Roadmap not found"}</div>
                    <div className="text-center">
                        <Button onClick={() => router.back()}>Go Back</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/my-interviews')}
                            className="mb-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Interviews
                        </Button>
                        <h1 className="text-3xl font-bold text-white">{roadmap.title}</h1>
                        <p className="text-gray-400 mt-2">{roadmap.description}</p>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">
                                    {roadmap.totalItems}
                                </div>
                                <div className="text-gray-400 text-sm">Total Items</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">
                                    {roadmap.completedItems}
                                </div>
                                <div className="text-gray-400 text-sm">Completed</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">
                                    {roadmap.totalItems - roadmap.completedItems}
                                </div>
                                <div className="text-gray-400 text-sm">Remaining</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">
                                    {Math.round(roadmap.completionPercentage)}%
                                </div>
                                <div className="text-gray-400 text-sm">Progress</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Progress Bar */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-white text-sm font-medium">Overall Progress</span>
                            <div className="flex-1 bg-gray-700 rounded-full h-3">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${roadmap.completionPercentage}%` }}
                                ></div>
                            </div>
                            <span className="text-white text-sm">{Math.round(roadmap.completionPercentage)}%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Roadmap Items */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">Learning Roadmap</CardTitle>
                        <CardDescription className="text-gray-400">
                            Interview Date: {formatDate(roadmap.interviewDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {roadmap.roadmapItems?.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex items-start space-x-4 p-4 rounded-lg border transition-all ${item.isCompleted
                                            ? 'bg-green-900/20 border-green-600/30'
                                            : isToday(item.dayDate)
                                                ? 'bg-blue-900/20 border-blue-600/50'
                                                : isPastDate(item.dayDate)
                                                    ? 'bg-red-900/20 border-red-600/30'
                                                    : 'bg-gray-700 border-gray-600'
                                        }`}
                                >
                                    {/* Completion Checkbox */}
                                    <div className="flex-shrink-0 pt-1">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={item.isCompleted}
                                                onCheckedChange={(checked) => handleItemComplete(item.id, checked)}
                                                disabled={updatingItem === item.id}
                                                className="border-gray-400"
                                            />
                                            {updatingItem === item.id && (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Item Type Icon */}
                                    <div className={`p-3 rounded-full ${getItemTypeColor(item.itemType)}`}>
                                        {getItemTypeIcon(item.itemType)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className={`text-lg font-medium ${item.isCompleted ? 'text-green-400' : 'text-white'}`}>
                                                {item.title}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                {isToday(item.dayDate) && (
                                                    <Badge className="bg-blue-600 text-white">Today</Badge>
                                                )}
                                                <Badge variant="outline" className="text-gray-300 border-gray-500">
                                                    {formatDate(item.dayDate)}
                                                </Badge>
                                                <Badge className={`${getItemTypeColor(item.itemType)} text-white`}>
                                                    {item.itemType.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>

                                        <p className="text-gray-400 mb-3">{item.description}</p>

                                        {item.estimatedHours && (
                                            <div className="flex items-center text-gray-400 text-sm mb-3">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Estimated: {item.estimatedHours} hours
                                            </div>
                                        )}

                                        {/* Resources */}
                                        {(item.videoLinks?.length > 0 || item.websiteLinks?.length > 0 || item.resourceLinks?.length > 0) && (
                                            <div className="space-y-2">
                                                {item.videoLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                                                            <PlayCircle className="h-4 w-4 mr-1" />
                                                            Videos
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.videoLinks.map((link, idx) => (
                                                                <Button
                                                                    key={idx}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => window.open('#', '_blank')}
                                                                    className="bg-red-600/20 border-red-600/50 text-red-300 hover:bg-red-600/30"
                                                                >
                                                                    <PlayCircle className="h-3 w-3 mr-1" />
                                                                    {link}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.websiteLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                                                            <ExternalLink className="h-4 w-4 mr-1" />
                                                            Websites
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.websiteLinks.map((link, idx) => (
                                                                <Button
                                                                    key={idx}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => window.open(link, '_blank')}
                                                                    className="bg-blue-600/20 border-blue-600/50 text-blue-300 hover:bg-blue-600/30"
                                                                >
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Visit
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {item.resourceLinks?.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                                                            <BookOpen className="h-4 w-4 mr-1" />
                                                            Resources
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.resourceLinks.map((resource, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="outline"
                                                                    className="bg-green-600/20 border-green-600/50 text-green-300"
                                                                >
                                                                    {resource}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {item.isCompleted && item.completionNotes && (
                                            <div className="mt-3 p-2 bg-green-900/20 rounded border border-green-600/30">
                                                <p className="text-green-300 text-sm">
                                                    <CheckCircle className="h-4 w-4 inline mr-1" />
                                                    {item.completionNotes}
                                                </p>
                                            </div>
                                        )}
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
