import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Dashboard() {
    const { user } = useAuth()
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fname}</h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Card title="Apply for Leave" to="/apply" description="Submit a new leave request." />
                <Card title="My Leave History" to="/leaves" description="View the status of your requests." />
                {user?.role === 'admin' && (
                    <Card title="Admin Dashboard" to="/admin/dashboard" description="View company-wide statistics." />
                )}
            </div>
        </div>
    )
}

function Card({ title, to, description }: { title: string; to: string, description: string }) {
    return (
        <Link to={to} className="block rounded-lg border bg-white p-6 hover:shadow-md hover:-translate-y-1 transition-transform">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <div className="mt-4 text-sm font-medium text-indigo-600">Go to page →</div>
        </Link>
    )
}