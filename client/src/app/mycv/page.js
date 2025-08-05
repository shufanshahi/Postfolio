'use client';
import { useState, useEffect } from 'react';
import CvViewer from "@/component/CvViewer";

export default function CvDownloadButton() {
    const [loading, setLoading] = useState(false);
    const [profileId, setProfileId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileId = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/profile/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch profile ID');

                const data = await response.json();
                setProfileId(data.id);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchProfileId();
    }, []);

    const downloadCv = async () => {
        if (!profileId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/cv/generate/${profileId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to generate CV');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'my_cv.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={downloadCv}
                disabled={loading || !profileId}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                {loading ? 'Generating CV...' : 'Download CV'}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}

            <div>
                <h1 className="text-3xl font-bold mb-6">My CV</h1>
                <CvViewer profileId={profileId} />
            </div>
        </div>


    );
}