// frontend/src/pages/ManageLeaves.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useSearchParams } from 'react-router-dom';
import type { User, Role } from '../context/AuthContext';

// --- TYPE DEFINITION ---
type Leave = {
    _id: string;
    user: {
        _id: string;
        fname: string;
        lname: string;
        role: Role;
        supervisor?: string;
    };
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
async function getAllLeaves() {
    const { data } = await api.get<Leave[]>('/leave/all');
    return data;
}
async function makeSupervisorDecision({ id, decision, comment }: { id: string; decision: 'approved' | 'declined'; comment?: string }) {
    return api.put(`/leave/supervisor/decision/${id}`, { decision, comment });
}
async function makeAdminDecision({ id, action, comment }: { id: string; action: 'approve' | 'decline'; comment?: string }) {
    const endpoint = `/leave/${action}/${id}`;
    return api.put(endpoint, { comment });
}

// --- PERMISSION HELPER FUNCTION ---
function canUserActOn(currentUser: User | null, requestor: Leave['user']): boolean {
    if (!currentUser) return false;
    const roles: Record<Role, number> = { user: 1, supervisor: 2, admin: 3, superadmin: 4 };
    return roles[currentUser.role] > roles[requestor.role];
}

// --- MAIN COMPONENT ---
export default function ManageLeaves() {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { data: leaves, isLoading, error } = useQuery({ queryKey: ['allLeaves'], queryFn: getAllLeaves });

    const [searchParams, setSearchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const [modalState, setModalState] = useState<{ isOpen: boolean; leave: Leave | null; action: 'approve' | 'decline' | null }>({ isOpen: false, leave: null, action: null });
    const [comment, setComment] = useState('');
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);
    const [mutatingLeaveId, setMutatingLeaveId] = useState<string | null>(null);

    useEffect(() => { setStatusFilter(searchParams.get('status') || 'all'); }, [searchParams]);

    const filteredLeaves = useMemo(() => {
        if (!leaves) return [];

        let leavesToDisplay = leaves;
        if (currentUser?.role === 'supervisor') {
            leavesToDisplay = leaves.filter(leave => leave.user.supervisor === currentUser._id);
        }

        return leavesToDisplay.filter(leave => {
            const fullName = `${leave.user.fname} ${leave.user.lname}`.toLowerCase();
            const nameMatch = searchTerm ? fullName.includes(searchTerm.toLowerCase()) : true;
            const statusMatch = statusFilter === 'all' || leave.status === statusFilter;
            return nameMatch && statusMatch;
        });
    }, [leaves, searchTerm, statusFilter, currentUser]);

    const mutationOptions = {
        onMutate: (variables: { id: string }) => { setMutatingLeaveId(variables.id); },
        onSettled: () => { queryClient.invalidateQueries({ queryKey: ['allLeaves'] }); handleCloseModal(); setMutatingLeaveId(null); },
    };
    const supervisorMutation = useMutation({ mutationFn: makeSupervisorDecision, ...mutationOptions });
    const adminMutation = useMutation({ mutationFn: makeAdminDecision, ...mutationOptions });

    const handleOpenModal = (leave: Leave, action: 'approve' | 'decline') => { setModalState({ isOpen: true, leave, action }); };
    const handleCloseModal = () => { setModalState({ isOpen: false, leave: null, action: null }); setComment(''); };
    const handleToggleReason = (leaveId: string) => { setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId)); };

    const handleConfirmDecision = () => {
        if (modalState.leave && modalState.action) {
            if (currentUser?.role === 'supervisor') {
                const decision = modalState.action === 'approve' ? 'approved' : 'declined';
                supervisorMutation.mutate({ id: modalState.leave._id, decision, comment });
            } else {
                adminMutation.mutate({ id: modalState.leave._id, action: modalState.action, comment });
            }
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        setSearchParams(params => {
            if (newStatus === 'all') params.delete('status');
            else params.set('status', newStatus);
            return params;
        });
    };

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading leave requests...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load requests. Please try logging in again.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Manage Leave Requests</h1>
            {currentUser?.role === 'supervisor' && (<div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm">You are viewing leave requests for your assigned users.</div>)}

            <div className="p-4 bg-white border rounded-lg flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full"><input type="text" placeholder="Search by employee name..." className="w-full border-gray-300 rounded-md text-gray-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="flex-1 w-full"><select className="w-full border-gray-300 rounded-md text-gray-900" value={statusFilter} onChange={handleStatusChange}><option value="all">All Statuses</option><option value="pending">Pending Supervisor Action</option><option value="awaiting_admin_approval">Pending Final Approval</option><option value="approved">Approved</option><option value="declined">Declined</option></select></div>
            </div>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50"><tr><Th>Employee (Role)</Th><Th>Dates</Th><Th>Reason & Notes</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredLeaves.map((leave) => {
                            const isExpanded = expandedReasonId === leave._id;
                            const canSupervisorAct = currentUser?.role === 'supervisor' && leave.status === 'pending' && canUserActOn(currentUser, leave.user);
                            const canAdminAct = (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && ['pending', 'awaiting_admin_approval'].includes(leave.status) && canUserActOn(currentUser, leave.user);
                            const isUpdating = mutatingLeaveId === leave._id;

                            return (
                                <tr key={leave._id}>
                                    <Td><p className="font-medium">{leave.user?.fname} {leave.user?.lname}</p><p className="text-xs text-gray-500 capitalize">{leave.user?.role}</p></Td>
                                    <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>
                                    <Td className="max-w-xs align-top"><p className={`font-medium ${isExpanded ? 'whitespace-normal' : 'truncate'}`}>{leave.reason}</p>{leave.reason.length > 100 && (<button onClick={() => handleToggleReason(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1">{isExpanded ? 'Read less' : 'Read more'}</button>)}{leave.supervisorComment && (<p className="text-xs text-gray-500 mt-1 italic"><span className="font-semibold not-italic">Supervisor Note:</span> {leave.supervisorComment}</p>)}{leave.adminComment && (<p className="text-xs text-gray-500 mt-1"><span className="font-semibold capitalize not-italic">{leave.actionTakenByRole || 'Manager'} Note:</span> {leave.adminComment}</p>)}</Td>
                                    <Td><StatusDisplay leave={leave} /></Td>
                                    <Td>{isUpdating ? (<span className="text-xs text-gray-500 italic">Updating...</span>) : ((canSupervisorAct || canAdminAct) && (<div className="flex items-center gap-4"><button onClick={() => handleOpenModal(leave, 'approve')} className="font-medium text-green-600">Approve</button><button onClick={() => handleOpenModal(leave, 'decline')} className="font-medium text-red-600">Decline</button></div>))}</Td>
                                </tr>
                            );
                        })}
                        {filteredLeaves.length === 0 && (<tr><td colSpan={5} className="text-center py-16 text-gray-500">{leaves && leaves.length > 0 ? 'No leave requests match your filters.' : 'No pending leave requests found.'}</td></tr>)}
                    </tbody>
                </table>
            </div>
            {modalState.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"><h2 className="text-lg font-bold capitalize">{modalState.action} Leave Request</h2><p className="text-sm text-gray-600 mt-2">Provide an optional comment for your decision.</p><div className="mt-4"><textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full mt-1 border-gray-300 rounded-md shadow-sm text-gray-900" rows={3} /></div><div className="mt-6 flex justify-end gap-3"><button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button><button onClick={handleConfirmDecision} disabled={adminMutation.isPending || supervisorMutation.isPending} className={`px-4 py-2 text-white rounded-md ${modalState.action === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}>Confirm</button></div></div>
                </div>
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---
function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>; }
function Td({ children, className = '', ...rest }: React.ComponentProps<'td'>) { return <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`} {...rest}>{children}</td>; }
function StatusBadge({ status }: { status: Leave['status'] }) { const styles: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-green-100 text-green-800', declined: 'bg-red-100 text-red-800', awaiting_admin_approval: 'bg-blue-100 text-blue-800' }; const displayMap: Record<string, string> = { pending: "Pending Supervisor", awaiting_admin_approval: "Awaiting Admin", approved: "Approved", declined: "Declined" }; return <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{displayMap[status]}</span>; }
function StatusDisplay({ leave }: { leave: Leave }) { if (leave.status === 'awaiting_admin_approval') { const supDecisionStyle = leave.supervisorDecision === 'approved' ? 'text-green-700' : 'text-red-700'; return <div className="text-xs text-center"><StatusBadge status="awaiting_admin_approval" /> <span className={`block font-semibold ${supDecisionStyle}`}>Supervisor {leave.supervisorDecision}</span></div>; } return <StatusBadge status={leave.status} />; }