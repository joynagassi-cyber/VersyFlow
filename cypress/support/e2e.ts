/// <reference types="cypress" />

/**
 * Cypress E2E — VersyFlow global commands.
 *
 * The VersyFlow login flow is "frictionless identify": email + name, no
 * password. The app persists identity locally via `identifyLocal`
 * (SupabaseAuthService, src/auth/SupabaseAuthService.ts) and the
 * PowerSync sync bridges (family + profile) only activate for a real
 * authenticated Supabase session.
 *
 * Persistence model (web / Capacitor WebView):
 *   - MmkvStorage (localStorage-backed) is the storage adapter for the
 *     settings store. Its key is `versyflow-settings-storage` — a JSON
 *     string `{ uiLanguage, bibleTranslation, bibleVersionType,
 *     onboardingCompleted }`.
 *   - Separate per-key writes exist for boot-time restore:
 *     `versyflow:ui:language` and `versyflow:onboarding:completed`
 *     (raw values, not JSON).
 *
 * The command set here keeps the specs' login + onboarding concerns in
 * one place so each spec can focus on the behaviour under test.
 *
 * Important (Render static host): every `cy.visit` must target the
 * server-served `/` (index.html) because deep routes 404 — the CDN has
 * no SPA fallback. Sub-route navigation happens in-client via the
 * router. Do NOT add commands that `cy.visit` a sub-path.
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Seed localStorage with the completed-onboarding payload so the
       * app boots straight into /tabs/home without going through the
       * UI. Writes both the MmkvStorage JSON key
       * (`versyflow-settings-storage`) and the boot-time raw flag
       * (`versyflow:onboarding:completed`).
       *
       * Must be called after `cy.visit('/')` so the app's origin is
       * established; localStorage is per-origin.
       */
      seedOnboarding(): Chainable;

      /**
       * Seed onboarding completion + local identity so that subsequent
       * `cy.visit('/')` boots straight into /tabs/home.
       */
      seedOnboardedUser(email: string, name: string): Chainable;

      /**
       * Click the app's onboarding "skip" affordance to mark
       * onboardingCompleted in the settings store and reach /tabs/home.
       *
       * The onboarding welcome screen (`app/onboarding/welcome.tsx`)
       * exposes a plain `<button>` with label `t('common.skip')`
       * ("Passer" in French). The auth screens use `t('auth.skip')`
       * → "Continuer sans compte" via the shadcn Button component.
       * This command finds the right affordance dynamically.
       */
      completeOnboarding(): Chainable;

      /**
       * Visit the login screen and perform the frictionless identify.
       * After the call, the app should be navigated to /tabs/home
       * (or back to onboarding, which `completeOnboarding` will
       * finish).
       */
      loginFrictionless(email: string, name: string): Chainable;
    }
  }
}

Cypress.Commands.add('seedOnboarding', function () {
  // The settings-store boot path (initializeSettingsStore, src/store/
  // settings-store.ts) reads `versyflow:onboarding:completed` as a raw
  // "true" string — NOT the MmkvStorage JSON key
  // (`versyflow-settings-storage`). Both are kept in sync in-app; for
  // test seeding only the raw key matters for the RootRedirect.
  cy.window().then((win) => {
    win.localStorage.setItem('versyflow:onboarding:completed', 'true');
    win.localStorage.setItem('versyflow:ui:language', 'fr');
    // Also write the MmkvStorage JSON key so `hydrate()` has a payload
    // in case the app reads it via that path.
    win.localStorage.setItem(
      'versyflow-settings-storage',
      JSON.stringify({
        uiLanguage: 'fr',
        bibleTranslation: 'lsg',
        bibleVersionType: 'classical',
        onboardingCompleted: true,
      }),
    );
  });
});

Cypress.Commands.add('seedOnboardedUser', function (email, name) {
  this.seedOnboarding();
  const identKey = 'versyflow-identity';
  const payload = JSON.stringify({
    state: { email, name, identityType: 'local' },
    version: 0,
  });
  cy.window().then((win) => win.localStorage.setItem(identKey, payload));
});

Cypress.Commands.add('completeOnboarding', function () {
  // The welcome screen's skip button is a plain HTML <button> labelled
  // with `t('common.skip')` → "Passer" in French (the default UI
  // locale). The auth screens use `t('auth.skip')` → "Continuer sans
  // compte" via the shadcn Button component. Accept either so the
  // command works from the onboarding or the auth surface.
  cy.contains('button', 'Passer', {
      matchCase: false,
      timeout: 15_000,
    })
    .then((btn) => btn.click())
    .catch(() => {
      return cy.contains(
          'button',
          'Continuer sans compte',
          { matchCase: false, timeout: 15_000 },
        )
        .then((btn) => btn.click())
        .catch(() => {
          // Neither onboarding nor auth skip affordance found —
          // surface the error so the caller can adjust the spec.
          throw new Error(
            'completeOnboarding: no skip affordance (neither "Passer" on onboarding nor "Continuer sans compte" on auth).',
          );
        });
    });
});

Cypress.Commands.add('loginFrictionless', function (email, name) {
  cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
  // The frictionless login screen is under /tabs/auth (main app),
  // not a top-level /auth/login route (that would 404 on Render
  // static). The router handles the redirect; enter at `/` and let
  // it navigate.
  cy.get('input[type="email"]', { timeout: 30_000 }).type(email);
  cy.get('input[type="text"]').first().type(name);
  cy.contains('button', 'Continuer', { matchCase: false }).click();
  cy.location('pathname', { timeout: 60_000 }).should('include', 'home');
});

export {};
