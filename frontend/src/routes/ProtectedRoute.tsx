// frontend/src/routes/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth'; // <-- The hook is imported from here
import type { User } from '../context/AuthContext'; // <-- FIX: The User type is imported from its source
import type { JSX } from 'react';

export default function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Array<User['role']> }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (!user) {
        // If not logged in, redirect to the login page
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        // If the user's role is not in the allowed list, redirect to the dashboard
        return <Navigate to="/" replace />;
    }

    // If all checks pass, render the child component
    return children;
}