'use client';
import { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Info, User } from 'lucide-react';

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

                if (!cvRes.ok || !profileRes.ok) throw new Error('Failed to fetch data');

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
                <p className="text-gray-500 text-lg font-medium">Loading CV...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center py-10 font-medium">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg border border-gray-200 space-y-10">
            {/* Profile Header */}
            {profile && (
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <img
                        src={
                            profile.pictureBase64
                                ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                : '/default-profile.png'
                        }
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-blue-600 shadow"
                    />
                    <div className="text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 justify-center sm:justify-start">
                            <User className="w-6 h-6 text-blue-600" />
                            {profile.fullName}
                        </h1>
                        <p className="text-gray-600 mt-1 flex items-center gap-2 justify-center sm:justify-start">
                            <Info className="w-4 h-4 text-gray-500" />
                            {profile.bio || 'No bio provided.'}
                        </p>
                        <p className="text-gray-700 mt-2 flex items-center gap-2 italic justify-center sm:justify-start">
                            <GraduationCap className="w-4 h-4 text-green-600" />
                            {profile.education || 'No education info.'}
                        </p>
                    </div>
                </div>
            )}

            {/* CV Sections */}
            {cvEntries.length === 0 ? (
                <p className="text-center text-gray-400 italic">No CV entries found.</p>
            ) : (
                Object.entries(groupedEntries).map(([type, entries]) => (
                    <section key={type} className="space-y-3">
                        <div className="flex items-center gap-3 border-b pb-1 border-gray-200">
                            {getIcon(type)}
                            <h2 className="text-xl font-semibold text-blue-800 capitalize tracking-wide">
                                {type.toLowerCase()}
                            </h2>
                        </div>
                        <ul className="space-y-3 pl-5 border-l-2 border-blue-200">
                            {entries.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="relative text-gray-700 before:absolute before:-left-2 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full ml-2"
                                >
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

function getIcon(type) {
    const icons = {
        EDUCATION: <GraduationCap className="w-5 h-5 text-green-600" />,
        EXPERIENCE: <Briefcase className="w-5 h-5 text-yellow-600" />,
        PERSONAL: <User className="w-5 h-5 text-gray-600" />,
    };
    return icons[type.toUpperCase()] || <Info className="w-5 h-5 text-gray-400" />;
}
