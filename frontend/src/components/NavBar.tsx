// frontend/src/components/NavBar.tsx

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function NavBar() {
    const { user: currentUser } = useAuth();
    const { pathname } = useLocation();

    const navLink = (to: string, label: string) => (
        <Link
            className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 ${pathname === to ? 'font-semibold text-indigo-600' : ''}`}
            to={to}
        >
            {label}
        </Link>
    );

    const isManager = currentUser?.role === 'supervisor' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    const isFullAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    return (
        <header className="border-b bg-white sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link to="/"><img src="/logo.png" alt="Impact Catalysts Logo" className="h-8 w-auto" /></Link>
                    <nav className="flex items-center gap-2">
                        {navLink('/', 'Dashboard')}
                        {navLink('/apply', 'Apply')}
                        {navLink('/leaves', 'My Leaves')}
                        {isManager && (
                            <>
                                <div className="w-px h-6 bg-gray-200 mx-2" />
                                {navLink('/admin/dashboard', 'Admin Dashboard')}
                                {navLink('/admin/leaves', 'Manage Leaves')}

                                {isFullAdmin && (
                                    <>
                                        {navLink('/admin/holidays', 'Manage Holidays')}
                                        {/* --- THIS IS THE CHANGE --- */}
                                        {navLink('/admin/users/table', 'Users')}
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">{currentUser?.fname} {currentUser?.lname}</div>
                        <div className="text-xs text-gray-500">{currentUser?.leaveBalance} days left</div>
                    </div>
                    <button
                        className="text-sm px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        onClick={useAuth().logout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}