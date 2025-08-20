'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, FileText, Info, Loader2 } from 'lucide-react';
import CvViewer from "@/component/CvViewer";
import EducationManagement from "@/components/EducationManagement";

export default function CvDownloadButton() {
    const [loading, setLoading] = useState(false);
    const [profileId, setProfileId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

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
            }
        };

        fetchProfileId();
    }, []);

    const downloadCv = async () => {
        if (!profileId) return;

        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/cv/generate/${profileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to generate CV');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'professional_cv.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-stone-100">
            {/* Header with professional theme - Full Width */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10 w-full shadow-sm">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-slate-800">My Professional Profile</h1>
                        <Button
                            onClick={downloadCv}
                            disabled={loading || !profileId}
                            className="gap-2 bg-gradient-to-r from-sky-500 to-purple-500 hover:from-sky-600 hover:to-purple-600 text-white border-0 shadow-lg"
                            size="lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating CV...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Download CV
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error and Success Alerts - Full Width */}
            {error && (
                <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
                    <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {success && (
                <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
                    <Alert className="mb-6 bg-emerald-50 border-emerald-200 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>CV downloaded successfully.</AlertDescription>
                    </Alert>
                </div>
            )}
            

            {/* Main Content - Full Width */}
            <div className="w-full">
                {!profileId ? (
                    <div className="h-screen flex items-center justify-center">
                        <div className="space-y-4 text-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-sky-200/20 animate-pulse"></div>
                            </div>
                            <p className="text-sky-600 font-medium text-lg">Loading your profile...</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                        {/* Centered CV Viewer */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-4xl"> {/* Adjust max-width as needed */}
                                <Card className="bg-white border-slate-200 shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-slate-800 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-sky-500" />
                                            CV Map & Preview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <CvViewer profileId={profileId} />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}