// frontend/src/pages/AdminUserLeaves.tsx

import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import React, { useState } from 'react'; // Import useState for the toggle

// --- TYPE DEFINITIONS ---
type Leave = {
    _id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    adminComment?: string;
};
type UserLeaveData = {
    user: { fname: string; lname: string };
    leaves: Leave[];
};

// --- API FUNCTION ---
async function getLeavesForUser(userId: string | undefined): Promise<UserLeaveData | null> {
    if (!userId) return null;
    const { data } = await api.get<UserLeaveData>(`/admin/leaves/${userId}`);
    return data;
}

// --- MAIN PAGE COMPONENT ---
export default function AdminUserLeaves() {
    const { userId } = useParams<{ userId: string }>();

    // --- NEW: State to track expanded items ---
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['leavesForUser', userId],
        queryFn: () => getLeavesForUser(userId),
        enabled: !!userId,
    });

    // --- NEW: Toggle handlers ---
    const handleToggleReason = (leaveId: string) => {
        setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId));
    };
    const handleToggleComment = (leaveId: string) => {
        setExpandedCommentId(currentId => (currentId === leaveId ? null : leaveId));
    };

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500">Loading user's leave history...</div>;
    }
    if (error) {
        return <div className="text-center py-10 text-red-600">Failed to load data for this user.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/admin/user-report" className="text-sm font-medium text-indigo-600 hover:underline">
                    ← Back to Report
                </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
                Leave History for {data?.user.fname} {data?.user.lname}
            </h1>
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>Dates</Th>
                            <Th>Reason & Admin Notes</Th>
                            <Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data && data.leaves.length > 0 ? (
                            data.leaves.map((leave) => {
                                const isReasonExpanded = expandedReasonId === leave._id;
                                const isCommentExpanded = expandedCommentId === leave._id;
                                return (
                                    <tr key={leave._id}>
                                        <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>

                                        {/* --- UPDATED: This cell now has the "Read more" functionality --- */}
                                        <Td className="max-w-md align-top">
                                            <div>
                                                <p className={`font-medium ${isReasonExpanded ? 'whitespace-normal' : 'truncate'}`} title={isReasonExpanded ? '' : leave.reason}>
                                                    {leave.reason}
                                                </p>
                                                {leave.reason.length > 100 && (
                                                    <button onClick={() => handleToggleReason(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1">
                                                        {isReasonExpanded ? 'Read less' : 'Read more'}
                                                    </button>
                                                )}
                                            </div>

                                            {leave.adminComment && (
                                                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 italic">
                                                    <span className="font-semibold not-italic">Your Note:</span>
                                                    <p className={isCommentExpanded ? 'whitespace-normal' : 'truncate'}>
                                                        {leave.adminComment}
                                                    </p>
                                                    {leave.adminComment.length > 100 && (
                                                        <button onClick={() => handleToggleComment(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1 not-italic">
                                                            {isCommentExpanded ? 'Read less' : 'Read more'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </Td>

                                        <Td><StatusBadge status={leave.status} /></Td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-16 text-gray-500">
                                    This user has no leave history.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---
function Th({ children }: { children: React.ReactNode }) {
    return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>;
}
function Td({ children, className = '', ...rest }: React.ComponentProps<'td'>) {
    return <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`} {...rest}>{children}</td>;
}
function StatusBadge({ status }: { status: Leave['status'] }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        declined: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${styles[status]}`}>{status}</span>;
}