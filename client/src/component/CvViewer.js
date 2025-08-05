'use client';
import { useState, useEffect } from 'react';

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
                console.log('Token:', token);

                const [cvRes, profileRes] = await Promise.all([
                    fetch(`http://localhost:8080/api/cv/entries/${profileId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`http://localhost:8080/api/profile/${profileId}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                if (!cvRes.ok || !profileRes.ok) {
                    throw new Error('Failed to fetch data');
                }

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
        const type = entry.type || 'OTHER';
        if (!acc[type]) acc[type] = [];
        acc[type].push(entry);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <p className="text-gray-600 text-lg">Loading CV...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-10">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md">
            {/* 🧑 Profile Info */}
            {profile && (
                <div className="flex items-center gap-6 mb-10">
                    <img
                        src={profile.pictureBase64 ? `data:image/jpeg;base64,${profile.pictureBase64}` : '/default-profile.png'}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border"
                    />
                    <div>
                        <h1 className="text-2xl font-bold">{profile.fullName}</h1>
                        <p className="text-gray-600">{profile.bio}</p>
                        <p className="text-gray-800 mt-1 italic">🎓 {profile.education}</p>
                    </div>
                </div>
            )}

            {/* 📄 CV Entries */}
            {cvEntries.length === 0 ? (
                <p className="text-center text-gray-500">No CV entries found.</p>
            ) : (
                Object.entries(groupedEntries).map(([type, entries]) => (
                    <section key={type} className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 capitalize">
                            {type.toLowerCase()}
                        </h2>
                        <ul className="list-disc list-inside space-y-2">
                            {entries.map((entry) => (
                                <li key={entry.id} className="text-gray-800">
                                    {entry.content}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))
            )}
        </div>
    );
}
