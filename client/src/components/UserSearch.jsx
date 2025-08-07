'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Clock, UserCheck, UserX, Loader2, ExternalLink } from 'lucide-react';
import ConnectionButton from './ConnectionButton';

const UserSearch = ({ className }) => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async (term) => {
        if (!term || term.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/search/users?q=${encodeURIComponent(term)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to search users');

            const data = await response.json();
            setSearchResults(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearch(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleUserClick = (userId) => {
        router.push(`/user/${userId}`);
    };

    return (
        <Card className={`bg-gray-800 border-gray-700 ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <Search className="h-5 w-5 text-green-400" />
                    Search People
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Find and connect with other professionals
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-gray-600 bg-gray-700 text-white px-3 py-1 pl-10 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-green-400" />
                            <span className="ml-2 text-gray-300">Searching...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-red-400 text-center py-4">
                            Error: {error}
                        </div>
                    )}

                    {/* Search Results */}
                    {!loading && !error && searchResults.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-medium text-sm text-gray-400">
                                Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                            </h3>
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-gray-700/50 border border-gray-600 hover:border-green-500/30 transition-colors duration-200"
                                    onClick={() => handleUserClick(user.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1 cursor-pointer">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-white">{user.name || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div className="ml-4">
                                        <ConnectionButton targetUserId={user.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && !error && searchTerm.length >= 2 && searchResults.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No users found matching "{searchTerm}"</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default UserSearch;