'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, FileText, GraduationCap, Briefcase, User, Loader2 } from 'lucide-react';
import EducationManagement from "@/components/EducationManagement";
import WorkManagement from "@/components/WorkManagement";

export default function ProfileManagementPage() {
    const [loading, setLoading] = useState(true);
    const [profileId, setProfileId] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("education");

    useEffect(() => {
        const fetchProfileId = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/profile/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch profile ID');

                const data = await response.json();
                setProfileId(data.id);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileId();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="flex items-center justify-center h-screen">
                    <div className="space-y-4 text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-blue-200/20 animate-pulse"></div>
                        </div>
                        <p className="text-blue-400 font-medium text-lg">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10 w-full">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Profile Management</h1>
                        <Button
                            onClick={() => window.history.back()}
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                        >
                            Back
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-6xl mx-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border-gray-700/50">
                            <TabsTrigger 
                                value="education" 
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                            >
                                <GraduationCap className="h-4 w-4 mr-2" />
                                Education
                            </TabsTrigger>
                            <TabsTrigger 
                                value="work" 
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                            >
                                <Briefcase className="h-4 w-4 mr-2" />
                                Work Experience
                            </TabsTrigger>
                            <TabsTrigger 
                                value="preview" 
                                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                CV Preview
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="education" className="mt-6">
                            <Card className="bg-gray-800/50 border-gray-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-blue-400" />
                                        Education Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <EducationManagement userId={profileId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="work" className="mt-6">
                            <Card className="bg-gray-800/50 border-gray-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-blue-400" />
                                        Work Experience Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <WorkManagement userId={profileId} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-6">
                            <Card className="bg-gray-800/50 border-gray-700/50">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-400" />
                                        CV Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="bg-gray-900">
                                        <iframe
                                            src={`/mycv?preview=true&profileId=${profileId}`}
                                            className="w-full h-[800px] border-0"
                                            title="CV Preview"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
} 