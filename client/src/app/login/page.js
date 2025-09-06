'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                router.push('/dashboard');
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (error) {
            setError('Login failed. Please try again.');
            console.error('Login failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="bg-gradient-to-br from-teal-50/70 via-white/50 to-indigo-50/70 dark:from-slate-800/60 dark:via-slate-800/50 dark:to-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Sign in to your account to continue
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="pl-10 bg-white/50 border-white/40 focus:border-teal-500/50 dark:bg-slate-800/50 dark:border-slate-700/50 dark:focus:border-teal-400/50"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="pl-10 bg-white/50 border-white/40 focus:border-teal-500/50 dark:bg-slate-800/50 dark:border-slate-700/50 dark:focus:border-teal-400/50"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                        <div className="text-center pt-4 border-t border-white/20 dark:border-slate-700/50">
                            <p className="text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <Link
                                    href="/registration"
                                    className="font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
                                >
                                    Create one here
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}