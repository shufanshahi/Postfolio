"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, ExternalLink } from 'lucide-react';

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
            const response = await apiFetch(`/api/search/users?q=${encodeURIComponent(term)}`);

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
        <div className={`space-y-5 ${className}`}>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-sm ring-1 ring-white/40">
                        <Search className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Search People</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Find professionals across the network</p>
                    </div>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-teal-900/10 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur px-3 pl-10 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    <span className="ml-2 text-slate-600 dark:text-slate-400">Searching...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="text-red-600 text-center py-4 text-sm font-medium">Error: {error}</div>
            )}

            {/* Search Results */}
            {!loading && !error && searchResults.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-medium text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                    </h3>
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="group flex items-center justify-between p-4 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-teal-900/10 dark:border-slate-700/60 hover:border-teal-500/40 dark:hover:border-teal-400/40 backdrop-blur-sm transition-colors cursor-pointer"
                            onClick={() => handleUserClick(user.id)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Avatar className="h-11 w-11 rounded-xl ring-2 ring-white/60 dark:ring-slate-800/60 overflow-hidden">
                                    {user.pictureBase64 ? (
                                        <AvatarImage src={`data:image/jpeg;base64,${user.pictureBase64}`} />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-teal-500 via-indigo-500 to-amber-500 text-white text-sm font-semibold">
                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">{user.name || 'Unknown User'}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading && !error && searchTerm.length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                    <Search className="h-8 w-8 mx-auto mb-3 opacity-60" />
                    <p className="text-sm">No users found matching "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};

export default UserSearch;