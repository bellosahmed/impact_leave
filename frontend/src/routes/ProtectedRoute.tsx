// frontend/src/routes/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { Role } from '../context/AuthContext';
import type { JSX } from 'react';

/**
 * A component that protects routes from unauthorized access.
 * This is the definitive, corrected version that understands the superadmin role.
 */
export default function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Array<Role> }) {
    const { user, loading } = useAuth();

    // 1. Handle the loading state while authentication is in progress.
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Authenticating...</p>
            </div>
        );
    }

    // 2. Handle the unauthenticated state.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // --- THIS IS THE NEW, SIMPLIFIED, AND CORRECT LOGIC ---

    // 3. If the route requires specific roles, perform the authorization check.
    if (roles && roles.length > 0) {
        // Rule 1: A 'superadmin' has universal access to all protected routes.
        // If the user is a superadmin, grant access immediately, no matter what the 'roles' prop says.
        if (user.role === 'superadmin') {
            return children; // Access Granted for Super Admin
        }

        // Rule 2: For everyone else, check if their role is in the list of allowed roles.
        // This will correctly grant access to 'admins' and 'supervisors' for their specific pages.
        if (roles.includes(user.role)) {
            return children; // Access Granted for specific role
        }

        // Rule 3: If neither of the above is true, the user is not authorized.
        return <Navigate to="/" replace />; // Access Denied -> Redirect to Dashboard
    }

    // 4. If the route does not require any specific roles (like the main dashboard), grant access.
    return children;
}