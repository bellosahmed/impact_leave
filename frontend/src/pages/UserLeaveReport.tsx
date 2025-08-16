// frontend/src/pages/UserLeaveReport.tsx

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import React, { useState, useMemo } from 'react';

// --- TYPE DEFINITION ---
type UserLeaveSummary = { _id: string; fname: string; lname: string; email: string; leaveBalance: number; totalDaysTaken: number; };

// --- API FUNCTION ---
async function getUserLeaveSummary() {
    const { data } = await api.get<UserLeaveSummary[]>('/admin/user-leave-summary');
    return data;
}

// --- MAIN COMPONENT ---
export default function UserLeaveReport() {
    const { data: summary, isLoading, error } = useQuery({ queryKey: ['userLeaveSummary'], queryFn: getUserLeaveSummary });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!summary) return [];
        return summary.filter(user =>
            `${user.fname} ${user.lname}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [summary, searchTerm]);

    if (isLoading) return <div className="text-center py-10">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load report.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">User Leave Report</h1>

            {/* --- Search Bar UI --- */}
            <div className="p-4 bg-white border rounded-lg">
                <label htmlFor="search-user" className="sr-only">Search Users</label>
                <input
                    id="search-user" type="text" placeholder="Search by employee name..."
                    className="w-full md:w-1/3 border-gray-300 rounded-md text-gray-900"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr><Th>Employee Name</Th><Th>Email</Th><Th>Approved Days Taken</Th><Th>Remaining Balance</Th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user._id}>
                                <Td><Link to={`/admin/user-leaves/${user._id}`} className="font-medium text-indigo-600 hover:underline">{user.fname} {user.lname}</Link></Td>
                                <Td>{user.email}</Td>
                                <Td>{user.totalDaysTaken}</Td>
                                <Td>{user.leaveBalance}</Td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-16 text-gray-500">{summary && summary.length > 0 ? 'No users match your search.' : 'No user data found.'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---
function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-6 py-4 whitespace-nowrap text-gray-700">{children}</td>; }