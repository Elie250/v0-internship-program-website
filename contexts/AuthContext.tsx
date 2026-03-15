'use client';

import { createContext, ReactNode, useState } from 'react';

// Define User type
export type User = {
    id: string;
    name: string;
    email: string;
    roles?: string[];
};

// Define context type
export type AuthContextType = {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
};

// Create context
export const AuthContext = createContext<AuthContextType | null>(null);

// Props for provider
type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};