// frontend/src/pages/Verify.tsx

import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { AxiosError } from 'axios';

export default function Verify() {
    const [otp, setOtp] = useState('');
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();
    const location = useLocation();

    const userId = new URLSearchParams(location.search).get('userId');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!userId || !otp) {
            setApiError("User ID or OTP is missing.");
            return;
        }
        setApiError(null);
        setLoading(true);
        try {
            await api.post('/auth/verify', { userId, otp });
            nav('/login');
        } catch (e) {
            if (e instanceof AxiosError) {
                setApiError(e.response?.data?.msg || "Verification failed. Please check the OTP.");
            } else {
                setApiError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">Verify Your Account</h1>
                <p className="text-sm text-gray-600 mb-6">An OTP has been sent to your email. Please enter it below.</p>

                <div>
                    <label htmlFor="otp" className="sr-only">Enter OTP</label>
                    {/* FIX: Added text-gray-900 */}
                    <input
                        id="otp"
                        className="w-full border-gray-300 rounded-md shadow-sm px-3 py-2 text-center text-lg tracking-widest font-mono focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        autoComplete="one-time-code"
                    />
                </div>

                {apiError && <p className="text-sm text-red-600 mt-4">{apiError}</p>}

                <button
                    disabled={loading || !otp}
                    className="mt-6 w-full bg-indigo-600 text-white rounded-md py-2 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                    {loading ? 'Verifying...' : 'Verify Account'}
                </button>
            </form>
        </div>
    );
}