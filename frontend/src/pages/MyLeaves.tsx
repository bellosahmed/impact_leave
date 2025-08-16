// frontend/src/pages/MyLeaves.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import React, { useState, useMemo } from 'react';
import type { Role } from '../context/AuthContext';

// --- TYPE DEFINITION ---
type Leave = {
    _id: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined' | 'awaiting_admin_approval';
    adminComment?: string;
    actionTakenByRole?: Role;
    supervisorDecision: 'pending' | 'approved' | 'declined';
    supervisorComment?: string;
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

    // State for filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [filterDate, setFilterDate] = useState('');

    // State for expanding text
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

    // Memoized filtering logic
    const filteredLeaves = useMemo(() => {
        if (!leaves) return [];
        return leaves.filter(leave => {
            const statusMatch = statusFilter === 'all' || leave.status === statusFilter;

            if (!filterDate) {
                return statusMatch;
            }

            // Normalize dates to midnight UTC to avoid timezone issues in comparison
            const filterDateObj = new Date(filterDate);
            filterDateObj.setUTCHours(0, 0, 0, 0);

            const leaveStart = new Date(leave.startDate);
            leaveStart.setUTCHours(0, 0, 0, 0);

            const leaveEnd = new Date(leave.endDate);
            leaveEnd.setUTCHours(0, 0, 0, 0);

            // Check if the selected filter date is within the leave's start and end date range
            const dateMatch = filterDateObj >= leaveStart && filterDateObj <= leaveEnd;

            return statusMatch && dateMatch;
        });
    }, [leaves, statusFilter, filterDate]);

    const handleToggleReason = (leaveId: string) => { setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId)); };
    const handleToggleComment = (leaveId: string) => { setExpandedCommentId(currentId => (currentId === leaveId ? null : leaveId)); };

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading your leave history...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load leave history. Please try logging in again.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">My Leave Requests</h1>

            <div className="p-4 bg-white border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Filter by Date</label>
                    <input
                        id="date-filter" type="date"
                        className="mt-1 w-full border-gray-300 rounded-md text-gray-900"
                        value={filterDate} onChange={e => setFilterDate(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status</label>
                    <select
                        id="status-filter" className="mt-1 w-full border-gray-300 rounded-md text-gray-900"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending Supervisor</option>
                        <option value="awaiting_admin_approval">Awaiting Admin Approval</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50"><tr><Th>Dates</Th><Th>My Reason & Manager Notes</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLeaves.map((leave) => {
                            const isReasonExpanded = expandedReasonId === leave._id;
                            const isCommentExpanded = expandedCommentId === leave._id;
                            return (
                                <tr key={leave._id}>
                                    <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>
                                    <Td className="max-w-xs align-top">
                                        <div>
                                            <p className={`font-medium ${isReasonExpanded ? 'whitespace-normal' : 'truncate'}`} title={isReasonExpanded ? '' : leave.reason}>{leave.reason}</p>
                                            {leave.reason.length > 100 && (<button onClick={() => handleToggleReason(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1">{isReasonExpanded ? 'Read less' : 'Read more'}</button>)}
                                        </div>
                                        {leave.supervisorComment && (
                                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 italic">
                                                <span className="font-semibold not-italic">Supervisor's Note:</span>
                                                <p className={'whitespace-normal'}>{leave.supervisorComment}</p>
                                            </div>
                                        )}
                                        {leave.adminComment && (
                                            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                                                <span className="font-semibold not-italic capitalize">{leave.actionTakenByRole || 'Manager'}'s Note:</span>
                                                <p className={isCommentExpanded ? 'whitespace-normal' : 'truncate'}>{leave.adminComment}</p>
                                                {leave.adminComment.length > 100 && (<button onClick={() => handleToggleComment(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1 not-italic">{isCommentExpanded ? 'Read less' : 'Read more'}</button>)}
                                            </div>
                                        )}
                                    </Td>
                                    <Td><StatusDisplay leave={leave} /></Td>
                                    <Td>
                                        {leave.status === 'pending' && (<button disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(leave._id)} className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Cancel</button>)}
                                    </Td>
                                </tr>
                            );
                        })}
                        {filteredLeaves.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-16 text-gray-500">{leaves && leaves.length > 0 ? 'No requests match your filters.' : 'You have not requested any leave.'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---
function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>; }
function Td({ children, className = '', ...rest }: React.ComponentProps<'td'>) { return <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`} {...rest}>{children}</td>; }
function StatusBadge({ status }: { status: Leave['status'] }) {
    const styles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800', awaiting_admin_approval: 'bg-blue-100 text-blue-800' };
    const displayMap: Record<string, string> = { pending: "Pending Supervisor", awaiting_admin_approval: "Awaiting Admin", approved: "Approved", declined: "Declined" };
    return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{displayMap[status]}</span>;
}
function StatusDisplay({ leave }: { leave: Leave }) {
    if (leave.status === 'awaiting_admin_approval') {
        const supDecisionStyle = leave.supervisorDecision === 'approved' ? 'text-green-700' : 'text-red-700';
        return <div className="text-xs text-center"><StatusBadge status="awaiting_admin_approval" /> <span className={`block font-semibold ${supDecisionStyle}`}>Supervisor {leave.supervisorDecision}</span></div>;
    }
    return <StatusBadge status={leave.status} />;
}