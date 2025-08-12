// frontend/src/pages/ManageLeaves.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import React, { useState } from 'react';
import { useAuth } from '../context/useAuth'; // Import useAuth to get the current user's role

// --- TYPE DEFINITION ---
// The user object within a leave now includes their role.
type Leave = {
    _id: string;
    user: {
        fname: string;
        lname: string;
        role: 'user' | 'admin' | 'superadmin';
    };
    startDate: string;
    endDate: string;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    adminComment?: string;
};

// --- API FUNCTIONS ---
async function getAllLeaves() {
    const { data } = await api.get<Leave[]>('/leave/all');
    return data;
}
async function makeLeaveDecision({ id, action, comment }: { id: string; action: 'approve' | 'decline'; comment?: string }) {
    const endpoint = `/leave/${action}/${id}`;
    return api.put(endpoint, { comment });
}

// --- MAIN COMPONENT ---
export default function ManageLeaves() {
    const { user: currentUser } = useAuth(); // Get the currently logged-in user
    const queryClient = useQueryClient();
    const { data: leaves, isLoading, error } = useQuery({ queryKey: ['allLeaves'], queryFn: getAllLeaves });

    // State for modal and text expansion
    const [modalState, setModalState] = useState<{ isOpen: boolean; leave: Leave | null; action: 'approve' | 'decline' | null }>({ isOpen: false, leave: null, action: null });
    const [comment, setComment] = useState('');
    const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

    const decisionMutation = useMutation({
        mutationFn: makeLeaveDecision,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allLeaves'] });
            handleCloseModal();
        },
    });

    const handleOpenModal = (leave: Leave, action: 'approve' | 'decline') => {
        setModalState({ isOpen: true, leave, action });
    };
    const handleCloseModal = () => {
        setModalState({ isOpen: false, leave: null, action: null });
        setComment('');
    };
    const handleConfirmDecision = () => {
        if (modalState.leave && modalState.action) {
            decisionMutation.mutate({ id: modalState.leave._id, action: modalState.action, comment });
        }
    };
    const handleToggleReason = (leaveId: string) => {
        setExpandedReasonId(currentId => (currentId === leaveId ? null : leaveId));
    };

    if (isLoading) return <div className="text-center py-10 text-gray-500">Loading leave requests...</div>;
    if (error) return <div className="text-center py-10 text-red-600">Failed to load requests.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Manage Leave Requests</h1>
            {currentUser?.role === 'admin' && (
                <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                    You are viewing leave requests as an admin. You can only take action on requests from regular users.
                </div>
            )}
            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>Employee (Role)</Th>
                            <Th>Dates</Th>
                            <Th>Reason & Notes</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {leaves?.map((leave) => {
                            const isExpanded = expandedReasonId === leave._id;

                            // --- UI PERMISSION LOGIC ---
                            // Determine if the action buttons should be shown for this specific row.
                            const canTakeAction =
                                // A superadmin can act on anyone's request.
                                currentUser?.role === 'superadmin' ||
                                // An admin can only act on a regular user's request.
                                (currentUser?.role === 'admin' && leave.user.role === 'user');

                            return (
                                <tr key={leave._id}>
                                    <Td>
                                        <p className="font-medium text-gray-900">{leave.user?.fname} {leave.user?.lname}</p>
                                        <p className="text-xs text-gray-500 capitalize">{leave.user?.role}</p>
                                    </Td>
                                    <Td>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</Td>
                                    <Td className="max-w-xs align-top">
                                        <p className={`font-medium ${isExpanded ? 'whitespace-normal' : 'truncate'}`} title={isExpanded ? '' : leave.reason}>
                                            {leave.reason}
                                        </p>
                                        {leave.reason.length > 100 && (
                                            <button onClick={() => handleToggleReason(leave._id)} className="text-indigo-600 text-xs font-semibold mt-1">
                                                {isExpanded ? 'Read less' : 'Read more'}
                                            </button>
                                        )}
                                        {leave.adminComment && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                <span className="font-semibold">Note:</span> {leave.adminComment}
                                            </p>
                                        )}
                                    </Td>
                                    <Td><StatusBadge status={leave.status} /></Td>
                                    <Td>
                                        {leave.status === 'pending' && canTakeAction && (
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => handleOpenModal(leave, 'approve')} className="font-medium text-green-600 hover:text-green-800">Approve</button>
                                                <button onClick={() => handleOpenModal(leave, 'decline')} className="font-medium text-red-600 hover:text-red-800">Decline</button>
                                            </div>
                                        )}
                                    </Td>
                                </tr>
                            );
                        })}
                        {leaves?.length === 0 && (<tr><td colSpan={5} className="text-center py-16 text-gray-500">No pending leave requests found.</td></tr>)}
                    </tbody>
                </table>
            </div>
            {modalState.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h2 className="text-lg font-bold capitalize">{modalState.action} Leave Request</h2>
                        <p className="text-sm text-gray-600 mt-2">
                            You are about to {modalState.action} this leave for {modalState.leave?.user.fname}.
                        </p>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Add an Optional Comment</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full mt-1 border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                placeholder="e.g., Approved, but please complete handover."
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                            <button onClick={handleConfirmDecision} disabled={decisionMutation.isPending} className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${modalState.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {decisionMutation.isPending ? 'Confirming...' : `Confirm ${modalState.action}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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