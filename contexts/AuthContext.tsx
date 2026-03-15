'use client'; // Must be at the very top

import { createContext, ReactNode, useState } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'client';
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

// Create the context with default empty functions
export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => { },
  logout: () => { },
});

type AuthProviderProps = {
  children: ReactNode;
};

// Provider component that wraps the app
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (newUser: User) => setUser(newUser);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};