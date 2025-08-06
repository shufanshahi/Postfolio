'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserX, Loader2, Users, MessageCircle } from 'lucide-react';

const ConnectionsList = ({ className }) => {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/connections/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch connections');

            const data = await response.json();
            setConnections(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveConnection = async (connectionId) => {
        setActionLoading(prev => ({ ...prev, [connectionId]: true }));
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/connections/${connectionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to remove connection');

            // Remove the connection from the list
            setConnections(prev => prev.filter(conn => conn.id !== connectionId));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [connectionId]: false }));
        }
    };

    const getConnectionUser = (connection) => {
        // Determine which user is the other person (not the current user)
        const token = localStorage.getItem('token');
        // This is a simplified approach - in a real app, you'd get the current user ID from context or state
        // For now, we'll assume the first user is the other person
        return {
            id: connection.requesterId,
            name: connection.requesterName,
            email: connection.requesterEmail,
            pictureBase64: connection.requesterPictureBase64
        };
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        My Connections
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        My Connections
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
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Connections
                    {connections.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {connections.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {connections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No connections yet</p>
                        <p className="text-sm">Start connecting with other users!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {connections.map((connection) => {
                            const user = getConnectionUser(connection);
                            return (
                                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={`data:image/jpeg;base64,${user.pictureBase64}`} />
                                            <AvatarFallback>
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Connected since {new Date(connection.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1"
                                        >
                                            <MessageCircle className="h-3 w-3" />
                                            Message
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRemoveConnection(connection.id)}
                                            disabled={actionLoading[connection.id]}
                                            className="gap-1"
                                        >
                                            {actionLoading[connection.id] ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <UserX className="h-3 w-3" />
                                            )}
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ConnectionsList; 