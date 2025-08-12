// frontend/src/pages/ResetPassword.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';

// The schema is now the single source of truth for the form data
const schema = z.object({
    email: z.string().email("A valid email is required"),
    otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // The onSubmit function is now much simpler.
    const onSubmit = async (data: FormData) => {
        setError(null);
        setMessage(null);
        setLoading(true);

        try {
            // We send the form data directly. The backend will handle finding the user by email.
            const response = await api.post('/auth/resetpassword', data);
            setMessage(response.data.msg + ". Redirecting to login...");

            // Redirect to login after a short delay on success
            setTimeout(() => {
                navigate('/login');
            }, 2500);

        } catch (e) {
            if (e instanceof AxiosError) {
                setError(e.response?.data?.msg || 'Failed to reset password.');
            } else {
                setError('An unexpected error occurred.');
            }
            // Only stop loading if there was an error
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Reset Your Password</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Your Email</label>
                        <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" type="email" {...register('email')} />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">OTP from Email</label>
                        <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" type="text" {...register('otp')} />
                        {errors.otp && <p className="text-xs text-red-600 mt-1">{errors.otp.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">New Password</label>
                        <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" type="password" {...register('password')} />
                        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                    </div>

                    {message && <p className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">{message}</p>}
                    {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">{error}</p>}

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-md py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline">Back to Sign in</Link>
                </p>
            </div>
        </div>
    );
}