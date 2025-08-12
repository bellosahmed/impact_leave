// frontend/src/pages/Signup.tsx

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react'; // <-- Step 1: Import useState
import { AxiosError } from 'axios';

const schema = z.object({
    fname: z.string().min(1, "First name is required"),
    lname: z.string().min(1, "Last name is required"),
    email: z.string().email(),
    phonenum: z.string().min(1, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function Signup() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
    const { signup } = useAuth();
    const nav = useNavigate();
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // --- THIS IS THE CHANGE (Part 1) ---
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const onSubmit = async (data: FormData) => {
        setApiError(null);
        setLoading(true);
        try {
            const res = await signup(data);
            nav(`/verify?userId=${res.newUser._id}`);
        } catch (e) {
            if (e instanceof AxiosError) {
                setApiError(e.response?.data?.message || 'Signup failed.');
            } else {
                setApiError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Create an Account</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
                            <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" {...register('fname')} />
                            {errors.fname && <p className="text-xs text-red-600 mt-1">{errors.fname.message}</p>}
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
                            <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" {...register('lname')} />
                            {errors.lname && <p className="text-xs text-red-600 mt-1">{errors.lname.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                        <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" type="email" {...register('email')} />
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Phone Number</label>
                        <input className="w-full border-gray-300 rounded-md shadow-sm text-gray-900" type="tel" {...register('phonenum')} />
                        {errors.phonenum && <p className="text-xs text-red-600 mt-1">{errors.phonenum.message}</p>}
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                        {/* --- THIS IS THE CHANGE (Part 2) --- */}
                        <div className="relative">
                            <input
                                className="w-full border-gray-300 rounded-md shadow-sm text-gray-900 pr-10"
                                type={isPasswordVisible ? 'text' : 'password'}
                                {...register('password')}
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(prev => !prev)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                                aria-label="Toggle password visibility"
                            >
                                {isPasswordVisible ? <EyeSlashedIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
                    </div>
                    {apiError && <p className="text-sm text-red-600 text-center">{apiError}</p>}
                    <button disabled={loading} className="w-full bg-indigo-600 text-white rounded-md py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

// --- THIS IS THE CHANGE (Part 3) ---
// Helper components for the eye icons
function EyeIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.43-4.43a1.012 1.012 0 0 1 1.414 0l4.43 4.43a1.012 1.012 0 0 1 0 .639l-4.43 4.43a1.012 1.012 0 0 1-1.414 0l-4.43-4.43Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
    );
}

function EyeSlashedIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );
}