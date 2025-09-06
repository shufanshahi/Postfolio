'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return false;
            }

            // Verify token by fetching user profile
            const response = await apiFetch('/api/profile/me');
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setIsAuthenticated(true);
                setIsLoading(false);
                return true;
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('token');
                setIsAuthenticated(false);
                setUser(null);
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return false;
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Fetch user profile after successful login
            await checkAuth();

            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    const register = async (name, email, password, role = 'User') => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            // Fetch user profile after successful registration
            await checkAuth();

            return { success: true };
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        register,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
