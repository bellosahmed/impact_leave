// frontend/src/pages/MyLeaves.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import React, { useState } from 'react';

// --- TYPE DEFINITION ---
type Leave = {
    _id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    adminComment?: string;
};

// --- API FUNCTIONS ---
async function getMyLeaves() {
    const { data } = await api.get<Leave[]>('/leave/my');
    return data;
}
async function cancelLeave(id: string) {
    return api.delete(`/leave/cancel/${id}`);
}

// --- MAIN COMPONENT ---
export default function MyLeaves() {
    const queryClient = useQueryClient();
    const { data: leaves, isLoading, error } = useQuery({ queryKey: ['myLeaves'], queryFn: getMyLeaves });
    const cancelMutation = useMutation({
        mutationFn: cancelLeave,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
        },
    });

    // --- NEW: Separate state for expanding reason and comment ---
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

    // --- NEW: Separate toggle handlers for each ---
    const handleToggleReason = (leaveId: string) => {
        setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId));
    };
    const handleToggleComment = (leaveId: string) => {
        setExpandedCommentId(currentId => (currentId === leaveId ? null : leaveId));
    };

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading your leave history...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load leave history.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Leave Requests</h1>
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>Dates</Th>
                            <Th>My Reason & Admin Notes</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {leaves?.map((leave) => {
                            // Get the expanded state for both parts
                            const isReasonExpanded = expandedReasonId === leave._id;
                            const isCommentExpanded = expandedCommentId === leave._id;

                            return (
                                <tr key={leave._id}>
                                    <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>

                                    {/* --- UPDATED: This cell now handles both expansions independently --- */}
                                    <Td className="max-w-xs align-top">
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
                                                <span className="font-semibold not-italic">Admin's Note:</span>
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
                                    <Td>
                                        {leave.status === 'pending' && (
                                            <button
                                                disabled={cancelMutation.isPending}
                                                onClick={() => cancelMutation.mutate(leave._id)}
                                                className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                        {leaves?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-16 text-gray-500">You have not requested any leave.</td>
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
    const styles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800' };
    return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${styles[status]}`}>{status}</span>;
}