import { Navigate, useLocation } from 'react-router-dom';

const initialHash = typeof window !== 'undefined' ? window.location.hash : '';

export const RootRedirect = () => {
    const location = useLocation();
    const hash = location.hash || initialHash;

    if (hash.includes('type=recovery')) {
        return <Navigate to={`/reset-password${hash}`} replace />;
    }

    return <Navigate to="/chronicle" replace />;
};
