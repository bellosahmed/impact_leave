// frontend/src/context/useAuth.ts

import { createContext, useContext } from 'react';
import type { AuthCtx } from './AuthContext'; // <-- Use `import type` for type-only imports

// --- This is the new home for the Context definition ---
// We export it so AuthProvider can use it.
export const Ctx = createContext<AuthCtx | null>(null);

/**
 * This custom hook is the standard way to access the AuthContext.
 */
export function useAuth() {
    const context = useContext(Ctx);

    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}