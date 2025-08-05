'use client';
import { useState, useEffect } from 'react';
import "./cv-viewer.css"

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
        return <div className="cv-loading">Loading CV...</div>;
    }

    if (error) {
        return <div className="cv-error">Error: {error}</div>;
    }

    return (
        <div className="cv-container">
            {profile && (
                <div className="cv-header">
                    <img
                        src={
                            profile.pictureBase64
                                ? `data:image/jpeg;base64,${profile.pictureBase64}`
                                : '/default-profile.png'
                        }
                        alt="Profile"
                        className="cv-avatar"
                    />
                    <div className="cv-header-info">
                        <h1 className="cv-name">{profile.name}</h1>
                        <p className="cv-bio">{profile.bio || 'No bio provided.'}</p>
                        <p className="cv-edu">{profile.universityResult || 'No education info.'}</p>
                    </div>
                </div>
            )}

            {cvEntries.length === 0 ? (
                <p className="cv-empty">No CV entries found.</p>
            ) : (
                Object.entries(groupedEntries).map(([type, entries]) => (
                    <section key={type} className="cv-section">
                        <h2 className="cv-section-title">{type.toLowerCase()}</h2>
                        <ul className="cv-entry-list">
                            {entries.map((entry) => (
                                <li key={entry.id} className="cv-entry">
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
