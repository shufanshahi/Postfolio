'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Users, UserPlus, Clock, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import PendingRequests from '@/components/PendingRequests';
import ConnectionsList from '@/components/ConnectionsList';
import UserSearch from '@/components/UserSearch';
import Navbar from '@/components/Navbar';

export default function ConnectionsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('connections');

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Connections
                            </h1>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <Button
                            variant={activeTab === 'connections' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('connections')}
                            className={`flex-1 gap-2 ${activeTab === 'connections' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Users className="h-4 w-4" />
                            My Connections
                        </Button>
                        <Button
                            variant={activeTab === 'pending' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 gap-2 ${activeTab === 'pending' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Clock className="h-4 w-4" />
                            Pending
                        </Button>
                        <Button
                            variant={activeTab === 'sent' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('sent')}
                            className={`flex-1 gap-2 ${activeTab === 'sent' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <UserPlus className="h-4 w-4" />
                            Sent
                        </Button>
                        <Button
                            variant={activeTab === 'search' ? 'default' : 'ghost'}
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 gap-2 ${activeTab === 'search' ? 'bg-gradient-to-r from-sky-300 to-sky-400 text-white' : 'text-gray-700 hover:bg-white'}`}
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        {activeTab === 'connections' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Users className="h-5 w-5 text-sky-500" />
                                        My Connections
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        People you're connected with
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ConnectionsList />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'pending' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Clock className="h-5 w-5 text-purple-500" />
                                        Pending Requests
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Incoming connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <PendingRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'sent' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <UserPlus className="h-5 w-5 text-amber-500" />
                                        Sent Requests
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Your outgoing connection requests
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SentRequests />
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === 'search' && (
                            <Card className="bg-white border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Search className="h-5 w-5 text-green-500" />
                                        Search People
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Find and connect with others
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <UserSearch />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

const SentRequests = () => {
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Keep original data fetching logic
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

        fetchSentRequests();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-600 text-center py-4">Error: {error}</div>;
    }

    return (
        <>
            {sentRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sent requests</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-sky-300 transition-colors">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-gradient-to-br from-sky-400 to-sky-500 text-white">
                                        {request.receiverName?.charAt(0)?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-gray-900">{request.receiverName}</p>
                                    <p className="text-sm text-gray-600">{request.receiverEmail}</p>
                                    <p className="text-xs text-gray-500">
                                        Sent on {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                Pending
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};