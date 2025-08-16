// frontend/src/pages/ResetPassword.tsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Zod schema with strong password validation
const strongPassword = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})');
const schema = z.object({
    password: z.string().regex(strongPassword, "Needs 8+ chars, uppercase, lowercase, number, & special char."),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const token = searchParams.get('token');
    const userId = searchParams.get('id');

    useEffect(() => {
        if (!token || !userId) {
            setError("Invalid or missing password reset link. Please request a new one.");
        }
    }, [token, userId]);

    const onSubmit = async (data: FormData) => {
        if (!token || !userId) return;
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            const payload = { token, userId, password: data.password };
            const response = await api.post('/auth/resetpassword', payload);
            setMessage(response.data.msg + " Redirecting to login...");
            setTimeout(() => navigate('/login'), 2500);
        } catch (e) {
            if (e instanceof AxiosError) setError(e.response?.data?.msg || 'Failed to reset password.');
        } finally {
            if (!message) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Set Your Password</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md space-y-4">
                    <div><label className="block text-sm">New Password</label><input className="w-full border rounded p-2 text-gray-900" type="password" {...register('password')} />{errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}</div>
                    <div><label className="block text-sm">Confirm New Password</label><input className="w-full border rounded p-2 text-gray-900" type="password" {...register('confirmPassword')} />{errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}</div>
                    {message && <p className="text-sm text-green-600">{message}</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button disabled={loading || !token || !userId} className="w-full bg-indigo-600 text-white rounded-md py-2 font-semibold">
                        {loading ? 'Setting Password...' : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}