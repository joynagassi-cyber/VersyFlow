/** Explicit local development mode; never implicitly activated in production. */
export const isDemoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';
