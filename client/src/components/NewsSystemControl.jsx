import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, RefreshCw, Clock, Settings, CheckCircle, XCircle } from 'lucide-react';

const NewsSystemControl = () => {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [status, setStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(false);

    const testAutomatedNews = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const response = await fetch('/api/news/test-auto-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            setTestResult(result);
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Network error: ' + error.message,
                timestamp: Date.now()
            });
        } finally {
            setTesting(false);
        }
    };

    const getSystemStatus = async () => {
        setLoadingStatus(true);
        try {
            const response = await fetch('/api/news/auto-status');
            const result = await response.json();
            setStatus(result);
        } catch (error) {
            setStatus({
                error: 'Failed to fetch status: ' + error.message
            });
        } finally {
            setLoadingStatus(false);
        }
    };

    React.useEffect(() => {
        getSystemStatus();
    }, []);

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Automated News System Control
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* System Status */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                System Status
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={getSystemStatus}
                                disabled={loadingStatus}
                            >
                                {loadingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>

                        {status && !status.error ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Service:</span>
                                    <span className="text-green-600 font-medium">{status.service}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Status:</span>
                                    <span className="text-green-600 font-medium capitalize">{status.status}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Schedule:</span>
                                    <span className="text-blue-600">{status.schedule}</span>
                                </div>
                                <div className="mt-2 p-2 bg-blue-50 rounded text-blue-700">
                                    {status.description}
                                </div>
                            </div>
                        ) : status?.error ? (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertDescription>{status.error}</AlertDescription>
                            </Alert>
                        ) : (
                            <div className="text-gray-500">Loading status...</div>
                        )}
                    </div>

                    {/* Manual Test */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Manual Test</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Test the automated news posting system manually. This will fetch latest job market news
                            from NewsAPI, process it with Gemini AI, and post it to the News account.
                        </p>

                        <Button
                            onClick={testAutomatedNews}
                            disabled={testing}
                            className="w-full sm:w-auto"
                        >
                            {testing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing News System...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Test News Posting
                                </>
                            )}
                        </Button>

                        {testResult && (
                            <Alert className={`mt-4 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                {testResult.success ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                                    <div className="font-medium mb-1">
                                        {testResult.success ? 'Test Successful!' : 'Test Failed!'}
                                    </div>
                                    <div className="text-sm">
                                        {testResult.message}
                                    </div>
                                    <div className="text-xs mt-2 opacity-70">
                                        {new Date(testResult.timestamp).toLocaleString()}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Schedule Information */}
                    <div className="border rounded-lg p-4 bg-blue-50">
                        <h3 className="font-semibold mb-2 text-blue-800">Automated Schedule</h3>
                        <div className="text-sm text-blue-700 space-y-1">
                            <p>• <strong>Frequency:</strong> Every hour (24 times per day)</p>
                            <p>• <strong>Timing:</strong> At 0 minutes of each hour (e.g., 1:00, 2:00, 3:00...)</p>
                            <p>• <strong>Content:</strong> Latest job market news and trends</p>
                            <p>• <strong>Fallback:</strong> Motivational career content if no news available</p>
                            <p>• <strong>Processing:</strong> AI-enhanced content with Gemini</p>
                        </div>
                    </div>

                    {/* API Information */}
                    <div className="border rounded-lg p-4 bg-yellow-50">
                        <h3 className="font-semibold mb-2 text-yellow-800">Data Sources</h3>
                        <div className="text-sm text-yellow-700 space-y-1">
                            <p>• <strong>News Source:</strong> NewsAPI.org (Job market keywords)</p>
                            <p>• <strong>AI Processing:</strong> Google Gemini 1.5 Flash</p>
                            <p>• <strong>Posting Account:</strong> News (Employer type)</p>
                            <p>• <strong>Content Focus:</strong> Job prospects, hiring trends, career opportunities</p>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default NewsSystemControl;
