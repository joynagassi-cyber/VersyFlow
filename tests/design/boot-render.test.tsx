/**
 * Garde-fou « écran noir » : monte réellement `src/main.tsx` et exige que
 * l'application rende du contenu.
 *
 * Origine du test (2026-10-30) : `<DevRouteRecorder />` était monté AVANT
 * `<BrowserRouter>` alors qu'il appelle `useLocation()`. React levait
 * « useLocation() may be used only in the context of a <Router> component »,
 * l'arbre entier échouait, et l'utilisateur voyait un écran noir
 * (`--color-background` = #121212) à la place de l'application.
 *
 * Ce test attrape la même famille de défauts : un composant qui consomme un
 * contexte (routeur, thème, i18n) monté hors de son fournisseur.
 */
import { describe, expect, it } from 'vitest';

describe('démarrage de l’application', () => {
  it('rend du contenu dans #root (aucun écran noir)', async () => {
    if (typeof window.matchMedia !== 'function') {
      // jsdom n'implémente pas matchMedia ; les navigateurs oui.
      window.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    }

    document.body.innerHTML = '<div id="root"></div>';
    const uncaught: unknown[] = [];
    const onError = (event: Event) => uncaught.push((event as ErrorEvent).error ?? event.type);
    const onRejection = (event: Event) => uncaught.push((event as PromiseRejectionEvent).reason);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    await import('../../src/main');
    // Le démarrage rend l'app au plus tard après 2 s (garde-fou de boot).
    await new Promise((resolve) => setTimeout(resolve, 2500));

    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);

    const html = document.getElementById('root')?.innerHTML ?? '';
    expect(uncaught).toEqual([]);
    expect(html.length).toBeGreaterThan(500);
    // Le splash statique d'index.html doit avoir cédé la place à React.
    expect(html).not.toContain('boot-splash');
    expect(document.querySelector('ion-app')).not.toBeNull();
  }, 20000);
});
