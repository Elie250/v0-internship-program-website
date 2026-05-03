import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        return { user: null, hasRole: () => false, isAuthenticated: () => false };
    }

    const { user } = context;

    const hasRole = (role: string) => {
        return user && user.role === role;
    };

    const isAuthenticated = () => {
        return !!user;
    };

    return {
        user,
        hasRole,
        isAuthenticated,
    };
};

export default useAuth;
