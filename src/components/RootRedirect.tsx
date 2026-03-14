import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LandingPage } from '../features/landing/LandingPage';

const initialHash = typeof window !== 'undefined' ? window.location.hash : '';

export const RootRedirect = () => {
    const location = useLocation();
    const { isAuthenticated, loading } = useAuth();
    const hash = location.hash || initialHash;

    if (hash.includes('type=recovery')) {
        return <Navigate to={`/reset-password${hash}`} replace />;
    }

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to="/chronicle" replace />;
    }

    return <LandingPage />;
};
