// frontend/src/lib/api.ts

import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { // <-- ADD THIS SECTION
        'Content-Type': 'application/json', // Set the default content type for all requests
    },
});

// This interceptor adds the JWT token to every request's Authorization header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// This interceptor handles 401 Unauthorized errors (e.g., expired token)
api.interceptors.response.use(
    (res) => res, // If the response is successful, just pass it through
    (err) => {
        // If the server responds with a 401 error...
        if (err?.response?.status === 401) {
            // Remove the invalid token from storage
            localStorage.removeItem('accessToken');
            // Redirect the user to the login page, unless they are already there
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        // Return the error so that the calling function can handle it (e.g., show an error message)
        return Promise.reject(err);
    }
);

export default api;