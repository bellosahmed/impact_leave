// frontend/src/context/AuthContext.tsx

import { useEffect, useState, useCallback } from 'react';
import { Ctx } from './useAuth';
import api from '../lib/api';

// --- TYPE DEFINITIONS ---

// The definitive list of all possible roles in the application.
export type Role = 'user' | 'supervisor' | 'admin' | 'superadmin';

// The definitive shape of a User object, including all optional fields.
export type User = {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    role: Role;
    leaveBalance: number;
    phonenum?: number;
    supervisor?: string; // This will be the ID of the supervisor user
    jobTitle?: string;
};

// Types for the signup process.
export type SignupPayload = {
    fname: string;
    lname: string;
    email: string;
    phonenum: string;
    password: string;
};
export type SignupResponse = {
    newUser: User;
    token: string;
    status: boolean;
};

// The definitive type for the context's value.
export type AuthCtx = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (payload: SignupPayload) => Promise<SignupResponse>;
    logout: () => void;
};

// --- MAIN AUTH PROVIDER COMPONENT ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to set user state, wrapped in useCallback for stability.
    const updateUser = useCallback((newUser: User | null) => {
        setUser(newUser);
    }, []);

    // Fetches the current user's profile from the backend.
    // Wrapped in useCallback to prevent re-creation on every render.
    const fetchMe = useCallback(() => {
        return api.get<User>('/user/me')
            .then(r => updateUser(r.data))
            .catch(() => {
                localStorage.removeItem('accessToken');
                updateUser(null);
            })
            .finally(() => setLoading(false));
    }, [updateUser]);

    // This effect runs once on initial application load to check for a logged-in user.
    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, [fetchMe]);

    // Handles the user login process.
    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password });
        if (data?.token) {
            localStorage.setItem('accessToken', data.token);
            updateUser(data.user);
        }
    };

    // Handles the user signup process.
    const signup = async (payload: SignupPayload): Promise<SignupResponse> => {
        const { data } = await api.post<SignupResponse>('/auth/signup', payload);
        return data;
    };

    // Handles the user logout process.
    const logout = () => {
        localStorage.removeItem('accessToken');
        updateUser(null);
        api.post('/auth/logout').catch(() => { }); // Attempt to logout on backend, but don't block UI if it fails
        window.location.href = '/login';
    };

    // The value object provided to all child components via the context.
    const value = { user, loading, login, signup, logout };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}