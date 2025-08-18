// frontend/src/components/UserFormModal.tsx

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { User } from '../context/AuthContext';
import { AxiosError } from 'axios';

// --- SCHEMA & TYPE DEFINITIONS ---

// 1. A schema for the raw form data (everything is a string from the input fields).
const formSchema = z.object({
    fname: z.string().min(1, "First name is required"),
    lname: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    phonenum: z.string().min(1, "Phone number is required"),
    password: z.string().optional(),
    role: z.enum(['user', 'supervisor', 'admin', 'superadmin']),
    leaveBalance: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
        message: "Leave balance must be a number of 0 or greater",
    }),
    supervisor: z.string().optional(),
    jobTitle: z.string().optional(),
});

// 2. A schema that transforms the raw form data into the correct types for API submission.
const apiSchema = formSchema.extend({
    phonenum: z.string().transform(Number),
    leaveBalance: z.string().transform(Number)
});

// 3. A conditional validation schema for editing a user.
const editApiSchema = apiSchema.refine(data => !data.password || data.password.length >= 6, {
    message: "If provided, the new password must be at least 6 characters",
    path: ["password"],
});

// TypeScript types derived from our schemas.
type FormFields = z.infer<typeof formSchema>;
type ApiPayload = z.infer<typeof apiSchema>;

// --- API FUNCTIONS ---
async function getSupervisors() {
    const { data } = await api.get<User[]>('/admin/supervisors');
    return data;
}
async function createUser(payload: Omit<ApiPayload, 'password'>) {
    return api.post('/admin/users', payload);
}
async function updateUser({ id, payload }: { id: string; payload: Partial<ApiPayload> }) {
    return api.patch(`/admin/users/${id}`, payload);
}

// --- COMPONENT PROPS ---
interface UserFormModalProps {
    mode: 'add' | 'edit';
    userToEdit?: User | null;
    onClose: () => void;
}

// --- MAIN COMPONENT ---
export default function UserFormModal({ mode, userToEdit, onClose }: UserFormModalProps) {
    const queryClient = useQueryClient();
    const { data: supervisors } = useQuery({ queryKey: ['supervisors'], queryFn: getSupervisors });

    const { register, handleSubmit, formState: { errors } } = useForm<FormFields>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fname: userToEdit?.fname || '',
            lname: userToEdit?.lname || '',
            email: userToEdit?.email || '',
            phonenum: userToEdit?.phonenum?.toString() || '',
            role: userToEdit?.role || 'user',
            leaveBalance: userToEdit?.leaveBalance?.toString() || '30',
            supervisor: userToEdit?.supervisor || '',
            jobTitle: userToEdit?.jobTitle || '',
            password: '',
        }
    });

    const mutation = useMutation({
        mutationFn: (validatedData: ApiPayload) => {
            if (mode === 'add') {
                const payload = { ...validatedData };
                delete (payload as Partial<ApiPayload>).password;
                return createUser(payload as Omit<ApiPayload, 'password'>);
            } else if (userToEdit) {
                const payload: Partial<ApiPayload> = { ...validatedData };
                if (!payload.password) {
                    delete payload.password;
                }
                return updateUser({ id: userToEdit._id, payload });
            }
            throw new Error("Invalid operation: mode or userToEdit is missing.");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
            onClose();
        }
    });

    const onSubmit = (data: FormFields) => {
        const schemaToUse = mode === 'edit' ? editApiSchema : apiSchema;
        const result = schemaToUse.safeParse(data);
        if (result.success) {
            mutation.mutate(result.data);
        } else {
            console.error("Zod validation failed:", result.error.flatten().fieldErrors);
        }
    };

    const isPending = mutation.isPending;
    const error = mutation.error;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-xl font-bold mb-6">{mode === 'add' ? 'Add New User' : `Edit User: ${userToEdit?.fname}`}</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm">First Name</label><input className="w-full border rounded p-2 text-gray-900" {...register('fname')} />{errors.fname && <p className="text-xs text-red-500">{errors.fname.message}</p>}</div>
                        <div><label className="block text-sm">Last Name</label><input className="w-full border rounded p-2 text-gray-900" {...register('lname')} />{errors.lname && <p className="text-xs text-red-500">{errors.lname.message}</p>}</div>
                        <div><label className="block text-sm">Email</label><input type="email" className="w-full border rounded p-2 text-gray-900" {...register('email')} />{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}</div>
                        <div><label className="block text-sm">Phone Number</label><input type="tel" className="w-full border rounded p-2 text-gray-900" {...register('phonenum')} />{errors.phonenum && <p className="text-xs text-red-500">{errors.phonenum.message}</p>}</div>
                        <div><label className="block text-sm">Job Title</label><input className="w-full border rounded p-2 text-gray-900" {...register('jobTitle')} />{errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle.message}</p>}</div>
                        <div><label className="block text-sm">User Privileges</label><select className="w-full border rounded p-2 text-gray-900" {...register('role')}><option value="user">User</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></select>{errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}</div>
                        <div><label className="block text-sm">Leave Balance</label><input type="number" className="w-full border rounded p-2 text-gray-900" {...register('leaveBalance')} />{errors.leaveBalance && <p className="text-xs text-red-500">{errors.leaveBalance.message}</p>}</div>
                        <div><label className="block text-sm">Assign Supervisor</label><select className="w-full border rounded p-2 text-gray-900" {...register('supervisor')}><option value="">None</option>{supervisors?.map(s => (<option key={s._id} value={s._id}>{s.fname} {s.lname}</option>))}</select></div>
                        {mode === 'edit' && <div><label className="block text-sm">New Password</label><input type="password" placeholder="Leave blank to keep same" className="w-full border rounded p-2 text-gray-900" {...register('password')} />{errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}</div>}
                    </div>
                    {mode === 'add' && <p className="text-sm text-blue-600 p-3 bg-blue-50 rounded-md">A "Welcome & Set Password" email will be sent to the user.</p>}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button disabled={isPending} type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">{isPending ? 'Saving...' : 'Save User'}</button>
                    </div>
                    {error && <p className="text-sm text-red-500 mt-2">Error: {(error as AxiosError<{ message: string }>).response?.data?.message || 'An unexpected error occurred.'}</p>}
                </form>
            </div>
        </div>
    );
}