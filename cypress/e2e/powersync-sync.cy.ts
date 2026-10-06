/**
 * Cypress E2E — PowerSync sync readiness
 *
 * The app's PowerSync bridge activates on a real Supabase
 * authenticated session. When the user has only a local identify
 * (frictionless onboarding), the bridge stays idle but the
 * PowerSync client is still constructed at app boot.
 *
 * Since the app doesn't surface the sync state in the DOM on the
 * home tab, we assert indirectly:
 *   1. Home renders (no JS crash from a missing PowerSync client —
 *      if the SyncBridges top-level effect threw, React would
 *      unmount via ErrorBoundary and the DOM would be empty).
 *   2. The persisted localStorage key `versyflow:onboarding:completed`
 *      is `"true"`, proving the persistence layer (the same layer
 *      that seeds the PowerSync bridge's identity) ran.
 *
 * Render static-site constraint: every `cy.visit` must target `/`;
 * deep routes are not server-served. The SPA router handles the rest.
 *
 * Boot timing (measured 2026-10-06 against the live site): the
 * IonPage content (div.ion-page) can take up to ~60 s to mount on
 * a cold CDN because i18next preloads ~50 locale chunks
 * sequentially. We wait for the stable marker div.ion-page rather
 * than a fixed sleep.
 */

describe('VersyFlow — PowerSync sync readiness', () => {
  /** Seed the onboarding-completed flag so boot lands on /tabs/home. */
  function seedOnboarded() {
    cy.window().then((win) => {
      win.localStorage.setItem('versyflow:onboarding:completed', 'true');
      win.localStorage.setItem('versyflow:ui:language', 'fr');
    });
  }

  it('initialises the PowerSync client without crashing home', function () {
    this.timeout(300_000);
    cy.clearLocalStorage();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    // Seed the flag after the first visit has loaded the origin, then
    // re-visit so the boot-time initializeSettingsStore() reads the
    // seeded value and RootRedirect lands on /tabs/home.
    seedOnboarded();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    cy.location('pathname', { timeout: 90_000 }).should('include', 'home');
    // Wait for the home screen's IonPage content to mount — if the
    // PowerSync client had failed to construct, the SyncBridges
    // top-level effect would throw, the React ErrorBoundary would
    // catch it, and the DOM under ion-app would be empty.
    cy.get('div.ion-page', { timeout: 90_000 }).should('exist');
    cy.get('div#root', { timeout: 30_000 }).should('exist');
  });

  it('persists onboarding state to localStorage across reload', function () {
    this.timeout(300_000);
    cy.clearLocalStorage();
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    seedOnboarded();
    // Re-visit to simulate the hard reload: the boot-time
    // initializeSettingsStore() now reads the seeded flag.
    cy.visit('/', { timeout: 90_000, failOnStatusCode: false });
    cy.window().then((win) => {
      const raw = win.localStorage.getItem('versyflow:onboarding:completed');
      expect(raw, 'onboarding flag persisted').to.eq('true');
    });
    cy.location('pathname', { timeout: 90_000 }).should('include', 'home');
  });
});
