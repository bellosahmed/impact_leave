// frontend/src/pages/UsersHub.tsx

import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth'; // <-- Import useAuth to check the user's role

export default function UsersHub() {
    const { user: currentUser } = useAuth(); // <-- Get the currently logged-in user

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">User Administration</h1>
                <p className="text-gray-600">Select a task below to manage users or view reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* --- THIS IS THE CHANGE --- */}
                {/* The "User Management Table" card is now only visible to the superadmin */}
                {currentUser?.role === 'superadmin' && (
                    <ReportCard
                        title="User Management Table"
                        to="/admin/users/table"
                        description="Add, edit, delete, and manage all users in the system."
                    />
                )}

                <ReportCard
                    title="User Leave Report"
                    to="/admin/user-report"
                    description="View a summary of all leave taken by each user."
                />
            </div>
        </div>
    );
}

// Helper component for the navigation cards
function ReportCard({ title, to, description }: { title: string; to: string, description: string }) {
    return (
        <Link to={to} className="block rounded-lg border bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-transform">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <div className="mt-4 text-sm font-medium text-indigo-600">Proceed →</div>
        </Link>
    );
}