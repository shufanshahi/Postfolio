'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, UserPlus, Clock } from 'lucide-react';
import PendingRequests from '@/components/PendingRequests';
import ConnectionsList from '@/components/ConnectionsList';

export default function ConnectionsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('connections');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard')}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
                    <Button
                        variant={activeTab === 'connections' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('connections')}
                        className="flex-1 gap-2"
                    >
                        <Users className="h-4 w-4" />
                        My Connections
                    </Button>
                    <Button
                        variant={activeTab === 'pending' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('pending')}
                        className="flex-1 gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Pending Requests
                    </Button>
                    <Button
                        variant={activeTab === 'sent' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('sent')}
                        className="flex-1 gap-2"
                    >
                        <UserPlus className="h-4 w-4" />
                        Sent Requests
                    </Button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'connections' && <ConnectionsList />}
                    {activeTab === 'pending' && <PendingRequests />}
                    {activeTab === 'sent' && <SentRequests />}
                </div>
            </div>
        </div>
    );
}

// SentRequests component
const SentRequests = () => {
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSentRequests();
    }, []);

    const fetchSentRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/connections/pending/sent', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch sent requests');

            const data = await response.json();
            setSentRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Sent Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Sent Requests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-red-500 text-center py-4">
                        Error: {error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Sent Requests
                    {sentRequests.length > 0 && (
                        <span className="ml-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                            {sentRequests.length}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sentRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No sent requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sentRequests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-sm font-medium">
                                            {request.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{request.receiverName}</p>
                                        <p className="text-sm text-muted-foreground">{request.receiverEmail}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Sent on {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 