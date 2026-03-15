import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useAuth = () => {
    const { user } = useContext(AuthContext);

    const hasRole = (role) => {
        return user && user.roles && user.roles.includes(role);
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