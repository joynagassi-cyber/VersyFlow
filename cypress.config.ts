import { defineConfig } from 'cypress';

/**
 * Cypress E2E configuration for VersyFlow.
 *
 * The app is served from a deployed Render static site; the backend
 * (Supabase + PowerSync Cloud) is the production instance the build was
 * compiled against. Point `CYPRESS_BASE_URL` at a different host to test
 * a preview or a local `vite preview`.
 *
 * Credentials: the VersyFlow login flow is "frictionless identify"
 * (email + name, no password — see app/(tabs)/auth/login.tsx). No real
 * Supabase credentials are required for the E2E specs: `identifyLocal`
 * persists identity locally and the PowerSync sync bridge only activates
 * for a genuine authenticated session. The specs assert the UI contract
 * (onboarding → home, F5 persistence, PowerSync readiness) against the
 * deployed site.
 */
export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL || 'https://versyflow.onrender.com',
    // TypeScript via tsconfig-paths/register (Cypress 16 ships TS support).
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    // The site is a deployed SPA against a live Supabase + PowerSync Cloud;
    // sync + GoTrue round-trips can be slow on a cold Render instance.
    defaultCommandTimeout: 30_000,
    pageLoadTimeout: 120_000,
    // Keep the browser profile between tests so the Supabase/PowerSync
    // session + IndexedDB (useLocalStore) persist across `cy.visit()`
    // within a spec — the F5-persistence spec depends on that.
    setupNodeEvents(on, config) {
      // No setupNodeEvents side effects required.
      return config;
    },
  },
});
