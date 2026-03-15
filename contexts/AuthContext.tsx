'use client';

import { createContext, ReactNode, useState } from 'react';

// Define a type for your user object
type User = {
    id: string;
    name: string;
    email?: string;
};

// Props for AuthProvider
interface AuthProviderProps {
    children: ReactNode;
}

// Context type
type AuthContextType = {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
};

// Create context with type
export const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider with typed children
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