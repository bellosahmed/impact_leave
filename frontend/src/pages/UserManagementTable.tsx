// frontend/src/pages/UserManagementTable.tsx

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import React, { useState, useMemo } from 'react';
import type { User } from '../context/AuthContext';
import UserFormModal from '../components/UserFormModal';
import SkeletonLoader from '../components/SkeletonLoader';

// API functions
async function getAllUsers() {
    const { data } = await api.get<User[]>('/admin/users');
    return data;
}
async function deleteUser(userId: string) {
    return api.delete(`/admin/users/${userId}`);
}

export default function UserManagementTable() {
    const queryClient = useQueryClient();
    const { data: users, isLoading } = useQuery({ queryKey: ['allUsers'], queryFn: getAllUsers });

    const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; user?: User | null }>({
        isOpen: false,
        mode: 'add',
        user: null,
    });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user =>
            `${user.fname} ${user.lname}`.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const deleteMutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        },
    });

    const handleOpenAddModal = () => setModalState({ isOpen: true, mode: 'add', user: null });
    const handleOpenEditModal = (user: User) => setModalState({ isOpen: true, mode: 'edit', user });
    const handleCloseModal = () => setModalState({ isOpen: false, mode: 'add', user: null });

    return (
        // --- THIS IS THE UPDATED, SIMPLIFIED LAYOUT ---
        // The "User Reports" section has been completely removed from this page.
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">User Management Table</h1>
                <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700">
                    Add New User
                </button>
            </div>

            <div className="p-4 bg-white border rounded-lg">
                <label htmlFor="search-user" className="sr-only">Search Users</label>
                <input
                    id="search-user"
                    type="text"
                    placeholder="Search by user name..."
                    className="w-full md:w-1/3 border-gray-300 rounded-md text-gray-900"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Role</Th>
                            <Th>Leave Balance</Th>
                            <Th>Actions</Th>
                        </tr>
                    </thead>
                    {isLoading ? (
                        <SkeletonLoader rows={5} cols={5} />
                    ) : (
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <Td>{user.fname} {user.lname}</Td>
                                    <Td>{user.email}</Td>
                                    <Td className="capitalize">{user.role}</Td>
                                    <Td>{user.leaveBalance}</Td>
                                    <Td>
                                        <div className="flex items-center gap-4 font-medium">
                                            <button onClick={() => handleOpenEditModal(user)} className="text-indigo-600 hover:underline">Edit</button>
                                            <button
                                                onClick={() => { if (window.confirm(`Are you sure you want to delete ${user.fname}? This action is permanent.`)) deleteMutation.mutate(user._id) }}
                                                className="text-red-600 hover:underline"
                                                disabled={deleteMutation.isPending}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>
            </div>

            {modalState.isOpen && (
                <UserFormModal
                    mode={modalState.mode}
                    userToEdit={modalState.user}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

// --- HELPER COMPONENTS ---
function Th({ children }: { children: React.ReactNode }) { return <th className="text-left px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">{children}</th>; }
function Td({ children, className = '', ...rest }: React.ComponentProps<'td'>) { return <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`} {...rest}>{children}</td>; }