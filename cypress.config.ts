import { defineConfig } from 'cypress';

/**
 * Cypress E2E configuration for VersyFlow.
 *
 * The app is served from a static host; there is no backend to point at.
 * Point `CYPRESS_BASE_URL` at a different host to test a preview or a local
 * `vite preview`.
 *
 * Credentials: the VersyFlow login flow is "frictionless identify"
 * (email + name, no password — see app/(tabs)/auth/login.tsx). No real
 * No credentials are required: `identifyLocal` persists the identity locally
 * and every write lands in the browser store. The specs assert the UI contract
 * (onboarding → home, F5 persistence, local sync readiness).
 */
export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL || 'https://versyflow.onrender.com',
    // TypeScript via tsconfig-paths/register (Cypress 16 ships TS support).
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    // The site is a deployed SPA; a cold static host can be slow to answer.
    defaultCommandTimeout: 30_000,
    pageLoadTimeout: 120_000,
    // Keep the browser profile between tests so the local
    // session + IndexedDB (useLocalStore) persist across `cy.visit()`
    // within a spec — the F5-persistence spec depends on that.
    setupNodeEvents(on, config) {
      // No setupNodeEvents side effects required.
      return config;
    },
  },
});
