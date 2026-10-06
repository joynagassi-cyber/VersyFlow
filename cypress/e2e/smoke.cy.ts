/**
 * Cypress E2E — VersyFlow deployed site smoke test
 *
 * Proves the deployed Render static site boots and the primary UI flow
 * (onboarding → home) is reachable end-to-end against
 * https://versyflow.onrender.com.
 *
 * Rendering constraint (important): Render's static host serves only
 * `/` (index.html) — deep client-side routes (`/onboarding/*`,
 * `/tabs/*`) return 404 because the CDN has no SPA fallback. Every
 * spec in this project enters the app at `cy.visit('/')` and relies on
 * the in-client React Router for navigation.
 *
 * Boot-time reality (measured 2026-10-06 against the live site):
 *   - The app shell <ion-app> mounts ~immediately (React runs at module
 *     import time), but it renders with `style="display: none !important"`
 *     and 0 <ion-page> children for ~20–60 s: i18next preloads ~50
 *     locale chunks sequentially (each is a separate Vite dynamic import,
 *     one request at a time) and the route layout chunks load lazily.
 *   - The IonPage div (class `ion-page`, NOT the `<ion-page>` tag — Ionic
 *     renders IonPage as a plain div when no IonicRouter is active) with
 *     the skip button appears only once both are done.
 *   - The skip button label is "Passer" in FR and "Skip" in EN; a fresh
 *     profile with no stored `versyflow:ui:language` falls back to the
 *     navigator locale (EN in the Cypress CI sandbox → "Skip").
 *
 * Strategy: wait for the stable marker `div.ion-page` (the IonPage
 * content wrapper, not the `<ion-app>` shell) with a generous timeout
 * rather than a fixed sleep; assert on URL, not on i18n labels, where
 * the locale is uncertain. The onboarding-completed test seeds the
 * raw localStorage keys the boot path reads *before* cy.visit so the
 * router lands on /tabs/home instead of /onboarding/welcome.
 */

/** The IonPage content wrapper class Ionic React applies to a <div>
 *  when no IonicRouter is active — this is the marker that the
 *  active route's screen has finished mounting (layout + chunk). */
const ION_PAGE_SELECTOR = 'div.ion-page';

describe('VersyFlow — deployed site smoke', () => {
  /** Seed the onboarding-completed flag so boot lands on /tabs/home.
   *  initializeSettingsStore (src/store/settings-store.ts:130) reads
   *  `versyflow:onboarding:completed` as a raw "true" string — the
   *  MmkvStorage JSON key is only used for the hydrate() path. */
  function seedOnboarded() {
    cy.window().then((win) => {
      win.localStorage.setItem('versyflow:onboarding:completed', 'true');
      win.localStorage.setItem('versyflow:ui:language', 'fr');
    });
  }

  /** Seed an onboarded user with a local identity payload. */
  function seedOnboardedUser(email: string, name: string) {
    seedOnboarded();
    const identKey = 'versyflow-identity';
    const payload = JSON.stringify({
      state: { email, name, identityType: 'local' },
      version: 0,
    });
    cy.window().then((win) => win.localStorage.setItem(identKey, payload));
  }

  /** Wait for the router to settle on a pathname fragment. Polls the
   *  URL (no fixed sleep) — the first redirect can lag a few seconds
   *  behind DOMContentLoaded while React mounts. */
  function settleToPath(path: string, timeout = 90_000) {
    cy.location('pathname', { timeout }).should('include', path);
  }

  /** Wait for the active IonPage content to have mounted (the marker
   *  that the route's lazy chunk has loaded and the React tree under
   *  IonApp is fully rendered). i18next preloads ~50 locale chunks
   *  sequentially on first boot; on a cold CDN that can take up to
   *  ~60 s. We poll with a long timeout instead of a fixed cy.wait
   *  so the assertion is meaningful. */
  function waitForActiveScreen(timeout = 120_000) {
    cy.get(ION_PAGE_SELECTOR, { timeout }).should('exist');
  }

  it('boots and redirects an un-onboarded visitor to the welcome screen', function () {
    this.timeout(180_000);
    const consoleErrors: string[] = [];
    cy.on('window:before:load', (win) => {
      win.addEventListener('error', (e: ErrorEvent) =>
        consoleErrors.push(`window.onerror: ${e.message}`),
      );
      const origErr = win.console.error.bind(win.console);
      win.console.error = (...args: unknown[]) => {
        consoleErrors.push('console.error: ' + args.join(' '));
        origErr(...args);
      };
    });

    cy.clearLocalStorage();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    // RootRedirect (src/main.tsx:191) reads useSettingsStore.
    // onboardingCompleted with no stored identity → /onboarding/welcome.
    settleToPath('onboarding', 60_000);
    // If the router settled but the DOM is still blank, dump console
    // noise so the failure is actionable.
    cy.document().then((doc) => {
      const root = doc.getElementById('root');
      if (!root || !root.hasChildNodes()) {
        const detail =
          `#root empty at ${doc.location.pathname}. console:\n` +
          (consoleErrors.length ? consoleErrors.join('\n') : '(none captured)');
        throw new Error(detail);
      }
    });
    // The <ion-app> shell is in the DOM once React renders; its
    // IonPage content (div.ion-page) is what marks the screen ready.
    cy.get('ion-app', { timeout: 30_000 }).should('exist');
    waitForActiveScreen(120_000);
  });

  it('completes onboarding via skip and reaches /tabs/home', function () {
    this.timeout(300_000);
    cy.clearLocalStorage();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    settleToPath('onboarding', 60_000);
    // Wait for the onboarding screen's skip button to be in the DOM.
    // It is a plain <button> (app/onboarding/welcome.tsx:23) with label
    // t('common.skip') → "Passer" (FR) or "Skip" (EN fallback).
    waitForActiveScreen(120_000);
    cy.contains('button', /^Skip$|^Passer$/, { timeout: 30_000 })
      .first()
      .click();
    // After the click, completeOnboarding() sets onboardingCompleted
    // and navigate('/tabs/home', {replace:true}) runs — the URL
    // updates to /tabs/home within a beat.
    settleToPath('home', 90_000);
    cy.location('pathname').should('include', 'tabs');
  });

  it('lands on /tabs/home directly when onboarding was already completed', function () {
    this.timeout(180_000);
    // Seed the persisted onboarding flag before the page loads; the
    // boot-time initializeSettingsStore() then reads it and
    // RootRedirect lands straight on /tabs/home instead of the
    // onboarding flow.
    cy.clearLocalStorage();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    // The seed is written via cy.window() AFTER the page has loaded
    // its initial DOM, so the FIRST cy.visit may still have used the
    // (empty) localStorage during its RootRedirect evaluation. To
    // guarantee the flag is in place before the boot read happens,
    // write it, then re-visit so the second page load starts from
    // the seeded state — that is the hard-reload scenario we want
    // to test (F5 equivalent).
    seedOnboarded();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    settleToPath('home', 90_000);
  });
});
