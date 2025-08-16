// frontend/src/hooks/useOnClickOutside.ts

import { useEffect, type RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

/**
 * A custom React hook that triggers a handler function when a click or touch event
 * occurs outside of the referenced element.
 *
 * @param ref A React ref object attached to the element to monitor.
 * @param handler The function to call when a click outside occurs.
 */
// --- THIS IS THE DEFINITIVE FIX ---
// The signature now correctly uses a generic type `T` that extends `HTMLElement`.
// This makes the hook flexible and correctly typed to match what `useRef` provides.
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: AnyEvent) => void
) {
    useEffect(
        () => {
            const listener = (event: AnyEvent) => {
                const el = ref?.current;
                // The logic inside was already safe. It correctly checks if the ref is null.
                if (!el || el.contains(event.target as Node)) {
                    return;
                }
                handler(event);
            };

            document.addEventListener(`mousedown`, listener);
            document.addEventListener(`touchstart`, listener);

            // Cleanup function to remove the event listeners
            return () => {
                document.removeEventListener(`mousedown`, listener);
                document.removeEventListener(`touchstart`, listener);
            };
        },
        // Add ref and handler to the dependency array
        [ref, handler]
    );
}