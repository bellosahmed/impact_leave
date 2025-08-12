// frontend/src/context/AuthContext.tsx

import { useEffect, useState, useCallback } from 'react'; // <-- Import useCallback
import { Ctx } from './useAuth';
import api from '../lib/api';

// --- TYPE DEFINITIONS (Unchanged) ---
export type Role = 'user' | 'admin' | 'superadmin';
export type User = { _id: string; fname: string; lname: string; email: string; role: Role; leaveBalance: number; };
export type SignupPayload = { fname: string; lname: string; email: string; phonenum: string; password: string; };
export type SignupResponse = { newUser: User; token: string; status: boolean; };
export type AuthCtx = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; signup: (payload: SignupPayload) => Promise<SignupResponse>; logout: () => void; };

// --- MAIN AUTH PROVIDER COMPONENT ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // --- THIS IS THE FIX (Part 1) ---
    // We wrap the `updateUser` function in `useCallback` so it doesn't get recreated on every render.
    // The `setUser` function from useState is stable, so the dependency array is empty.
    const updateUser = useCallback((newUser: User | null) => {
        console.log("AuthContext: Setting user state to:", newUser);
        setUser(newUser);
    }, []);

    // --- THIS IS THE FIX (Part 2) ---
    // Now, we wrap `fetchMe` in `useCallback`. It will only be recreated if `updateUser` changes (which it won't).
    const fetchMe = useCallback(() => {
        return api.get<User>('/user/me')
            .then(r => updateUser(r.data))
            .catch(() => {
                localStorage.removeItem('accessToken');
                updateUser(null);
            })
            .finally(() => setLoading(false));
    }, [updateUser]);

    // --- THIS IS THE FIX (Part 3) ---
    // The `useEffect` hook now correctly includes `fetchMe` in its dependency array.
    // Since `fetchMe` is memoized by `useCallback`, this hook will only run ONCE on component mount.
    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, [fetchMe]);

    // The login function is also updated to use the memoized `updateUser` function.
    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data?.token) {
            localStorage.setItem('accessToken', data.token);
            updateUser(data.user);
        }
    };

    const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
        const { data } = await api.post<SignupResponse>('/auth/signup', payload);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        updateUser(null);
        api.post('/auth/logout').catch(() => { });
        window.location.href = '/login';
    };

    const value = { user, loading, login, signup, logout };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}