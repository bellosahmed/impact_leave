// frontend/src/routes/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { User } from '../context/AuthContext'; // Import the User type for props
import type { JSX } from 'react';

/**
 * A component that protects routes from unauthorized access.
 * It checks for authentication and authorization (roles).
 *
 * @param {JSX.Element} children - The component/page to render if the user is authorized.
 * @param {Array<User['role']>} [roles] - An optional array of roles that are allowed to access this route.
 */
export default function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: Array<User['role']> }) {
    // Get the current user's state from the authentication context.
    const { user, loading } = useAuth();

    // 1. Handle the loading state:
    // While the context is fetching the user profile, show a loading indicator.
    // This prevents a premature redirect to the login page.
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    // 2. Handle the unauthenticated state:
    // If loading is finished and there is no user, they are not logged in.
    // Redirect them to the login page. The `replace` prop prevents them from
    // using the "back" button to return to the protected page.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // --- THIS IS THE UPDATED AUTHORIZATION LOGIC ---

    // 3. Handle the Super Admin case (Universal Access):
    // If the user's role is 'superadmin', they have access to everything.
    // We immediately render the requested page without checking the `roles` prop.
    if (user.role === 'superadmin') {
        return children;
    }

    // 4. Handle the standard role check for non-superadmins:
    // If a `roles` array is provided, check if the user's role is included.
    if (roles && !roles.includes(user.role)) {
        // If the user's role is not in the allowed list, they are not authorized.
        // Redirect them to the main dashboard.
        return <Navigate to="/" replace />;
    }

    // 5. If all checks pass, the user is authenticated and authorized.
    // Render the requested page.
    return children;
}