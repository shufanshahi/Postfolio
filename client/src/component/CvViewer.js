'use client';
import { useState, useEffect } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CvViewer({ profileId }) {
    const [cvEntries, setCvEntries] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!profileId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('token');

                const [cvRes, profileRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/cv/entries/${profileId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`http://localhost:8080/api/profile/${profileId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (!cvRes.ok || !profileRes.ok)
                    throw new Error('Failed to fetch data');

                const cvData = await cvRes.json();
                const profileData = await profileRes.json();

                setCvEntries(cvData);
                setProfile(profileData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profileId]);

    const groupedEntries = cvEntries.reduce((acc, entry) => {
        const type = entry.type?.toUpperCase() || 'OTHER';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entry);
        return acc;
    }, {});

    if (loading) return <p className="text-center mt-10">Loading CV...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">Error: {error}</p>;

    // Extract skill entries and remove from main map
    const skillEntries = groupedEntries['SKILL'] || [];
    delete groupedEntries['SKILL'];

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
            {profile && (
                <Card className="rounded-2xl shadow-md border">
                    <CardHeader className="flex flex-row items-center gap-6">
                        <Avatar className="w-24 h-24 shadow">
                            <AvatarImage
                                src={
                                    profile.pictureBase64
                                        ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                        : '/default-profile.png'
                                }
                                alt="Profile"
                            />
                            <AvatarFallback>{profile.name?.slice(0, 2) || 'NA'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl font-semibold">{profile.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{profile.bio || 'No bio provided.'}</p>
                            <p className="text-sm text-muted-foreground">{profile.universityResult || 'No education info.'}</p>
                        </div>
                    </CardHeader>
                </Card>
            )}

            {/* Main CV Sections (excluding SKILLS) */}
            {Object.entries(groupedEntries).map(([type, entries]) => (
                <Card key={type} className="rounded-xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="capitalize text-lg tracking-wide text-primary">
                            {type.toLowerCase()}
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-3" />
                    <CardContent className="space-y-2 text-gray-800 text-sm">
                        <ul className="list-disc list-inside">
                            {entries.map((entry) => (
                                <li key={entry.id}>{entry.content}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            ))}

            {/* Skills at the bottom */}
            {skillEntries.length > 0 && (
                <Card className="rounded-xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="capitalize text-lg tracking-wide text-primary">
                            skills
                        </CardTitle>
                    </CardHeader>
                    <Separator className="mb-3" />
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {skillEntries.flatMap((entry) =>
                                entry.content.split(',').map((skill, i) => (
                                    <Badge
                                        key={i}
                                        className="text-sm px-3 py-1 rounded-xl bg-blue-100 text-blue-800"
                                    >
                                        {skill.trim()}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No entries */}
            {cvEntries.length === 0 && (
                <p className="text-center text-gray-500 mt-6">No CV entries found.</p>
            )}
        </div>
    );
}
