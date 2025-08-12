// frontend/src/pages/AdminDashboard.tsx

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link } from 'react-router-dom'; // <-- Import Link for the new card

// API function to fetch the main dashboard statistics
async function getDashboardStats() {
    const { data } = await api.get('/leave/dashboard');
    return data.dashboard;
}

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: getDashboardStats
    });

    if (isLoading) {
        return <div className="text-center py-10">Loading dashboard statistics...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

            {/* --- Top-level Statistics --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={stats?.totalUsers} />
                {/* The "Total Leaves" card has been removed as requested. */}
                <StatCard title="Pending Requests" value={stats?.pending} />
                <StatCard title="Approved Leaves" value={stats?.approved} />
                <StatCard title="Declined Leaves" value={stats?.declined} />
            </div>

            {/* --- New Section for Reports --- */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard
                        title="User Leave Report"
                        to="/admin/user-report"
                        description="View a summary of all leave taken by each user."
                    />
                </div>
            </div>
        </div>
    );
}

// Helper component for displaying a single statistic
function StatCard({ title, value }: { title: string; value?: number | string }) {
    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{value ?? 'N/A'}</p>
        </div>
    );
}

// New helper component for creating styled links to report pages
function ReportCard({ title, to, description }: { title: string; to: string, description: string }) {
    return (
        <Link to={to} className="block rounded-lg border bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-transform">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <div className="mt-4 text-sm font-medium text-indigo-600">View Report →</div>
        </Link>
    );
}