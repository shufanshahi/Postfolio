'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Download, AlertCircle, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import CvViewer from "@/component/CvViewer";
import Navbar from '@/components/Navbar';

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
        <div className="min-h-screen w-full relative overflow-x-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-32 -left-10 h-[38rem] w-[38rem] bg-gradient-to-br from-teal-200 via-teal-50 to-white dark:from-teal-600/30 dark:via-indigo-700/10 dark:to-transparent blur-3xl opacity-70" />
                <div className="absolute top-1/2 -right-40 h-[36rem] w-[36rem] bg-gradient-to-tr from-indigo-200 via-white to-amber-100 dark:from-indigo-700/30 dark:via-transparent dark:to-teal-700/20 blur-3xl opacity-60" />
            </div>
            <Navbar />

            {/* Floating download action */}
            <div className="fixed bottom-6 right-6 z-40">
                <Button
                    onClick={downloadCv}
                    disabled={loading || !profileId}
                    className="gap-2 rounded-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 shadow-lg shadow-teal-500/25"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            Download CV
                        </>
                    )}
                </Button>
            </div>

            {/* Alerts */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
                {error && (
                    <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-700">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="bg-emerald-50 border-emerald-200 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>CV downloaded successfully.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Main Content */}
            <div className="w-full">
                {!profileId ? (
                    <div className="h-[70vh] flex items-center justify-center">
                        <div className="space-y-4 text-center">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <div className="absolute inset-0 rounded-full border-2 border-teal-200/30 animate-pulse"></div>
                            </div>
                            <p className="text-teal-600 dark:text-teal-300 font-medium text-lg">Loading your profile...</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full px-4 sm:px-6 lg:px-8 py-10">
                        <div className="flex justify-center">
                            <div className="w-full max-w-5xl">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-sm text-sm font-semibold">CV</div>
                                    <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Resume Designer</h1>
                                </div>
                                <div className="rounded-2xl border border-teal-900/10 dark:border-slate-700/60 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/60 dark:to-slate-900/40 backdrop-blur-xl shadow-xl overflow-hidden">
                                    <CvViewer profileId={profileId} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}