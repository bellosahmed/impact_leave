// frontend/src/pages/AdminUserLeaves.tsx

import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import React, { useState, useMemo } from 'react';
import type { Role } from '../context/AuthContext';

// --- TYPE DEFINITIONS ---
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

// --- MAIN COMPONENT ---
export default function AdminUserLeaves() {
    const { userId } = useParams<{ userId: string }>();

    const [statusFilter, setStatusFilter] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
    const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['leavesForUser', userId],
        queryFn: () => getLeavesForUser(userId),
        enabled: !!userId,
    });

    const filteredLeaves = useMemo(() => {
        if (!data?.leaves) return [];
        return data.leaves.filter(leave => {
            const statusMatch = statusFilter === 'all' || leave.status === statusFilter;
            if (!filterDate) return statusMatch;
            const filterDateObj = new Date(filterDate);
            filterDateObj.setUTCHours(0, 0, 0, 0);
            const leaveStart = new Date(leave.startDate);
            leaveStart.setUTCHours(0, 0, 0, 0);
            const leaveEnd = new Date(leave.endDate);
            leaveEnd.setUTCHours(0, 0, 0, 0);
            const dateMatch = filterDateObj >= leaveStart && filterDateObj <= leaveEnd;
            return statusMatch && dateMatch;
        });
    }, [data, statusFilter, filterDate]);

    const handleToggleReason = (leaveId: string) => { setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId)); };
    const handleToggleComment = (leaveId: string) => { setExpandedCommentId(currentId => (currentId === leaveId ? null : leaveId)); };

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading user's leave history...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load data for this user.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4"><Link to="/admin/user-report" className="text-sm font-medium text-indigo-600 hover:underline">← Back to Report</Link></div>
            <h1 className="text-3xl font-bold text-gray-800">Leave History for {data?.user.fname} {data?.user.lname}</h1>
            <div className="p-4 bg-white border rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Filter by Date</label><input id="date-filter" type="date" className="mt-1 w-full border-gray-300 rounded-md text-gray-900" value={filterDate} onChange={e => setFilterDate(e.target.value)} /></div>
                <div><label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status</label><select id="status-filter" className="mt-1 w-full border-gray-300 rounded-md text-gray-900" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Statuses</option><option value="pending">Pending Supervisor</option><option value="awaiting_admin_approval">Awaiting Admin</option><option value="approved">Approved</option><option value="declined">Declined</option></select></div>
            </div>
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50"><tr><Th>Dates</Th><Th>Reason & Manager Notes</Th><Th>Status</Th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLeaves.map((leave) => {
                            const isReasonExpanded = expandedReasonId === leave._id;
                            const isCommentExpanded = expandedCommentId === leave._id;
                            return (
                                <tr key={leave._id}>
                                    <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>
                                    <Td className="max-w-md align-top">
                                        <div><p className={`font-medium ${isReasonExpanded ? 'whitespace-normal' : 'truncate'}`}>{leave.reason}</p>{leave.reason.length > 100 && (<button onClick={() => handleToggleReason(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1">{isReasonExpanded ? 'Read less' : 'Read more'}</button>)}</div>
                                        {leave.supervisorComment && (<div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200 italic"><span className="font-semibold not-italic">Supervisor's Note:</span><p className={'whitespace-normal'}>{leave.supervisorComment}</p></div>)}
                                        {leave.adminComment && (<div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200"><span className="font-semibold not-italic capitalize">{leave.actionTakenByRole || 'Manager'} Note:</span><p className={isCommentExpanded ? 'whitespace-normal' : 'truncate'}>{leave.adminComment}</p>{leave.adminComment.length > 100 && (<button onClick={() => handleToggleComment(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1 not-italic">{isCommentExpanded ? 'Read less' : 'Read more'}</button>)}</div>)}
                                    </Td>
                                    <Td><StatusDisplay leave={leave} /></Td>
                                </tr>
                            );
                        })}
                        {filteredLeaves.length === 0 && (
                            <tr><td colSpan={3} className="text-center py-16 text-gray-500">{data?.leaves && data.leaves.length > 0 ? 'No leaves match your filters.' : 'This user has no leave history.'}</td></tr>
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
function StatusBadge({ status }: { status: Leave['status'] }) { const styles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800', awaiting_admin_approval: 'bg-blue-100 text-blue-800' }; const displayMap: Record<string, string> = { pending: "Pending Supervisor", awaiting_admin_approval: "Awaiting Admin", approved: "Approved", declined: "Declined" }; return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{displayMap[status]}</span>; }
function StatusDisplay({ leave }: { leave: Leave }) { if (leave.status === 'awaiting_admin_approval') { const supDecisionStyle = leave.supervisorDecision === 'approved' ? 'text-green-700' : 'text-red-700'; return <div className="text-xs text-center"><StatusBadge status="awaiting_admin_approval" /> <span className={`block font-semibold ${supDecisionStyle}`}>Supervisor {leave.supervisorDecision}</span></div>; } return <StatusBadge status={leave.status} />; }