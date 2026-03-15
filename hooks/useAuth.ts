'use client';

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    const { user, login, logout } = context;

    const hasRole = (role: string) => {
        return user?.roles?.includes(role) ?? false;
    };

    return { user, login, logout, hasRole };
};