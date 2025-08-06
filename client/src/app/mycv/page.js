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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Professional Profile</h1>
                    <Button
                        onClick={downloadCv}
                        disabled={loading || !profileId}
                        className="gap-2"
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

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>CV downloaded successfully.</AlertDescription>
                    </Alert>
                )}

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Digital Curriculum Vitae
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!profileId ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-[200px]" />
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-[400px] w-full" />
                            </div>
                        ) : (
                            <CvViewer profileId={profileId} />
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        Tips for Your Job Search
                    </h2>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Customize your CV for each job application</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Keep your CV concise (1-2 pages recommended)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Highlight measurable achievements with numbers</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}