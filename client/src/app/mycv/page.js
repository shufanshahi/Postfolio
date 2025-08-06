'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, FileText, Info, Loader2 } from 'lucide-react';
import CvViewer from "@/component/CvViewer";

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
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header with dark theme - Full Width */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10 w-full">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">My Professional Profile</h1>
                        <Button
                            onClick={downloadCv}
                            disabled={loading || !profileId}
                            className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg"
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
                    <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-700 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {success && (
                <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
                    <Alert className="mb-6 bg-green-900/50 border-green-700 text-green-200">
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
                                <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-green-200/20 animate-pulse"></div>
                            </div>
                            <p className="text-green-400 font-medium text-lg">Loading your profile...</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full">
                        <CvViewer profileId={profileId} />
                    </div>
                )}
            </div>
        </div>
    );
}