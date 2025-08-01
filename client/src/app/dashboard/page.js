'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            router.push('/login');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const goToProfile = () => {
        router.push('/profile');
    };


    return (
        <div>
            <h1>Dashboard</h1>
            <p>Hello! You're logged in.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={goToProfile}>Profile</button>
                <button onClick={handleLogout}>Logout</button>
            </div>
        </div>
    );
}