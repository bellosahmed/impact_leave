// frontend/src/pages/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

async function getDashboardStats() {
    const { data } = await api.get('/leave/dashboard');
    return data.dashboard;
}

export default function AdminDashboard() {
    const { user: currentUser } = useAuth();
    const { data: stats, isLoading } = useQuery({ queryKey: ['adminDashboard'], queryFn: getDashboardStats });

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                    <StatCard title="Total Users" value={stats?.totalUsers} />
                )}
                <Link to="/admin/leaves"><StatCard title="Total Requests" value={stats?.totalLeaves} isLink={true} /></Link>
                <Link to="/admin/leaves?status=pending"><StatCard title="Pending Requests" value={stats?.pending} isLink={true} /></Link>
                <Link to="/admin/leaves?status=approved"><StatCard title="Approved Leaves" value={stats?.approved} isLink={true} /></Link>
                <Link to="/admin/leaves?status=declined"><StatCard title="Declined Leaves" value={stats?.declined} isLink={true} /></Link>
            </div>

            {(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Management & Reports</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Show only for superadmin */}
                        {currentUser?.role === 'superadmin' && (
                            <ReportCard
                                title="User Management Table"
                                to="/admin/users/table"
                                description="Add, edit, delete, and manage all users in the system."
                            />
                        )}
                        {/* Show for both admin and superadmin */}
                        <ReportCard
                            title="User Leave Report"
                            to="/admin/user-report"
                            description="View a summary of all leave taken by each user."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---
function StatCard({ title, value, isLink = false }: { title: string; value?: number | string; isLink?: boolean }) {
    const linkClasses = isLink ? 'hover:shadow-md hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer' : '';
    return (
        <div className={`bg-white p-6 rounded-lg border shadow-sm ${linkClasses}`}>
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value ?? 'N/A'}</p>
        </div>
    );
}

function ReportCard({ title, to, description }: { title: string; to: string, description: string }) {
    return (
        <Link to={to} className="block rounded-lg border bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-transform">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <div className="mt-4 text-sm font-medium text-indigo-600">View Page →</div>
        </Link>
    );
}
