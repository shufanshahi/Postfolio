'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const { isAuthenticated, isLoading } = useAuth();
        const router = useRouter();

        useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                router.push('/login');
            }
        }, [isAuthenticated, isLoading, router]);

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <Loader2 className="h-9 w-9 animate-spin text-teal-600 dark:text-teal-300 mx-auto mb-4" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">
                            Verifying authentication...
                        </p>
                    </div>
                </div>
            );
        }

        if (!isAuthenticated) {
            return null; // Will redirect to login
        }

        return <WrappedComponent {...props} />;
    };

    AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

    return AuthComponent;
};

export default withAuth;
