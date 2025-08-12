// frontend/src/pages/ForgotPassword.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // <-- Make sure useNavigate is imported

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // <-- Initialize the navigate function

    const onSubmit = async (data: FormData) => {
        setError(null);
        setMessage(null);
        setLoading(true);
        try {
            const response = await api.post('/auth/forgotpassword', data);

            // --- THIS IS THE NEW LOGIC ---
            // Set a more informative success message
            setMessage(response.data.msg + ". Redirecting you to reset your password...");

            // Automatically redirect the user to the reset password page after 2.5 seconds
            setTimeout(() => {
                navigate('/reset-password');
            }, 2500);

        } catch (e) {
            if (e instanceof AxiosError) {
                setError(e.response?.data?.msg || 'Failed to send reset email.');
            } else {
                setError('An unexpected error occurred.');
            }
            setLoading(false); // Only stop loading on error
        }
        // We don't set loading to false on success because we are about to navigate away
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Forgot Password</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md space-y-6">
                    <p className="text-sm text-center text-gray-600">
                        Enter your email and we'll send an OTP to reset your password.
                    </p>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                        <input
                            className="w-full border-gray-300 rounded-md shadow-sm text-gray-900"
                            type="email"
                            {...register('email')}
                        />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>

                    {message && <p className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">{message}</p>}
                    {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">{error}</p>}

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white rounded-md py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                        {loading ? 'Sending...' : 'Send Reset OTP'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                    Remember your password? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}