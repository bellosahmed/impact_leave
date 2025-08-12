// frontend/src/pages/UserLeaveReport.tsx

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom'; // <-- Import Link for navigation
import api from '../lib/api';
import React from 'react'; // Import React for helper components

// --- TYPE DEFINITION ---
type UserLeaveSummary = {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    leaveBalance: number;
    totalDaysTaken: number;
};

// --- API FUNCTION ---
async function getUserLeaveSummary() {
    const { data } = await api.get<UserLeaveSummary[]>('/admin/user-leave-summary');
    return data;
}

// --- MAIN COMPONENT ---
export default function UserLeaveReport() {
    const { data: summary, isLoading, error } = useQuery({
        queryKey: ['userLeaveSummary'],
        queryFn: getUserLeaveSummary
    });

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500">Loading User Leave Report...</div>;
    }
    if (error) {
        return <div className="text-center py-10 text-red-600">Failed to load report.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">User Leave Report</h1>
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>Employee Name</Th>
                            <Th>Email</Th>
                            <Th>Approved Days Taken</Th>
                            <Th>Remaining Balance</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {summary && summary.length > 0 ? (
                            summary.map((user) => (
                                <tr key={user._id}>
                                    <Td>
                                        {/* This creates a clickable link for each user */}
                                        <Link to={`/admin/user-leaves/${user._id}`} className="font-medium text-indigo-600 hover:underline">
                                            {user.fname} {user.lname}
                                        </Link>
                                    </Td>
                                    <Td>{user.email}</Td>
                                    <Td>{user.totalDaysTaken}</Td>
                                    <Td>{user.leaveBalance}</Td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center py-16 text-gray-500">
                                    No user data found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS (Now included in the file) ---
function Th({ children }: { children: React.ReactNode }) {
    return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
    return <td className="px-6 py-4 whitespace-nowrap text-gray-700">{children}</td>;
}