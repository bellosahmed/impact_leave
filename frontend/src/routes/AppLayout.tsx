// frontend/src/routes/AppLayout.tsx

import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

/**
 * This component acts as the main layout for the authenticated part of the app.
 * It includes the navigation bar and a main content area where all the protected
 * pages will be rendered.
 */
export default function AppLayout() {
    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />
            <main className="max-w-6xl mx-auto p-4 sm:p-6">
                {/* The <Outlet/> component from react-router-dom renders the active nested route */}
                <Outlet />
            </main>
        </div>
    );
}