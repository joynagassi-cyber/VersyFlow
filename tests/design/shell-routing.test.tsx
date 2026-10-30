/**
 * Comportement réel des coquilles, montées en jsdom.
 *
 * Les autres tests vérifient la structure par lecture de fichiers. Celui-ci va
 * plus loin : il rend vraiment `<AppShell />` dans un routeur, à trois largeurs
 * simulées, et observe **ce qui est monté**. C'est la seule preuve disponible
 * sans navigateur que :
 *
 *  - à 390 px, on a la navigation mobile et aucune trace du bureau ;
 *  - à 768 px, le rail remplace la barre d'onglets (contexte tablette) ;
 *  - à 1440 px, on a le rail, l'en-tête de bureau, et aucun onglet bas.
 *
 * `matchMedia` n'existe pas dans jsdom : on l'implémente pour la largeur
 * voulue, ce qui reproduit ce que fait le navigateur — les seuils testés sont
 * ceux du produit (768 / 1024).
 *
 * Rendu direct par `createRoot` (pas de @testing-library) : aucune dépendance
 * supplémentaire n'est ajoutée au dépôt pour ce test.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';

// React 18 exige ce drapeau pour que `act()` soit reconnu par l'environnement
// de test (sinon jsdom émet un avertissement à chaque rendu).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@ionic/react', async () => {
  const React = await import('react');
  const passthrough = (name: string) => {
    const Component = ({ children }: { children?: React.ReactNode }) =>
      React.createElement('div', { 'data-ion': name }, children);
    Component.displayName = name;
    return Component;
  };
  return {
    IonPage: passthrough('IonPage'),
    IonHeader: passthrough('IonHeader'),
    IonToolbar: passthrough('IonToolbar'),
    IonTitle: passthrough('IonTitle'),
    IonButtons: passthrough('IonButtons'),
    IonButton: passthrough('IonButton'),
    IonContent: passthrough('IonContent'),
    IonFab: passthrough('IonFab'),
    IonFabButton: passthrough('IonFabButton'),
    IonApp: passthrough('IonApp'),
  };
});

const root = join(__dirname, '../..');

/** Installe un `matchMedia` minimal pour une largeur donnée. */
function setViewportWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const match = /min-width:\s*(\d+)px/.exec(query);
    const matches = match ? width >= Number(match[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

let container: HTMLDivElement | null = null;
let reactRoot: Root | null = null;

async function renderShell(width: number) {
  setViewportWidth(width);
  const { AppShell } = await import('@/shells/AppShell');
  container = document.createElement('div');
  document.body.appendChild(container);
  reactRoot = createRoot(container);
  act(() => {
    reactRoot?.render(
      <MemoryRouter initialEntries={['/tabs/home']}>
        <Routes>
          <Route path="/tabs" element={<AppShell />}>
            <Route path="home" element={<div data-testid="ecran-accueil">accueil</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  });
}

const has = (selector: string) => document.querySelector(selector) !== null;
const count = (selector: string) => document.querySelectorAll(selector).length;

afterEach(() => {
  if (reactRoot) {
    act(() => reactRoot?.unmount());
    reactRoot = null;
  }
  container?.remove();
  container = null;
  document.body.innerHTML = '';
});

describe('coquilles — ce qui est réellement monté selon la largeur', () => {
  it('390 px : navigation mobile uniquement, aucun élément de bureau', async () => {
    await renderShell(390);

    // Écran partagé : le même composant dans les deux coquilles.
    expect(has('[data-testid="ecran-accueil"]')).toBe(true);

    // Navigation mobile présente.
    expect(has('nav[aria-label="Navigation principale"]')).toBe(true);
    expect(has('[aria-label="Ouvrir le menu"]')).toBe(true);

    // Aucun en-tête de bureau, aucun rail.
    expect(has('.desktop-rail')).toBe(false);
    expect(has('[aria-label="Recherche"]')).toBe(false);
  });

  it('768 px : contexte tablette — rail monté, onglets bas absents', async () => {
    await renderShell(768);

    expect(has('.desktop-rail')).toBe(true);
    expect(has('[aria-label="Recherche"]')).toBe(true);
    // Une seule navigation principale dans le DOM : le rail (un `<aside>`),
    // et plus aucune barre d'onglets basse.
    expect(count('[aria-label="Navigation principale"]')).toBe(1);
    expect(count('nav[aria-label="Navigation principale"]')).toBe(0);
    expect(has('[aria-label="Ouvrir le menu"]')).toBe(false);
  });

  it('1440 px : coquille de bureau complète', async () => {
    await renderShell(1440);

    expect(has('.desktop-rail')).toBe(true);
    expect(has('[aria-label="Recherche"]')).toBe(true);
    expect(has('[aria-label="Notifications"]')).toBe(true);
    expect(has('[aria-label="Ouvrir le menu"]')).toBe(false);
    // Le FAB « nouvelle session » du mobile n'est pas dupliqué sur le bureau.
    expect(has('[aria-label="Nouvelle session de mémorisation"]')).toBe(false);
  });

  it('les trois largeurs montent chacune une seule coquille', async () => {
    for (const width of [390, 768, 1440]) {
      await renderShell(width);
      const mobileCues = count('[aria-label="Ouvrir le menu"]');
      const desktopCues = count('.desktop-rail');
      // Exactement une des deux structures, jamais les deux.
      expect(mobileCues + desktopCues).toBeGreaterThan(0);
      expect(mobileCues === 0 || desktopCues === 0).toBe(true);
      act(() => reactRoot?.unmount());
      reactRoot = null;
      container?.remove();
      container = null;
      document.body.innerHTML = '';
    }
  });
});

describe('laboratoire — hors production', () => {
  it('le module du laboratoire n’est jamais importé par le shell', () => {
    const appShell = readFileSync(join(root, 'src', 'shells', 'AppShell.tsx'), 'utf8');
    expect(appShell).not.toMatch(/__dev/);
    expect(appShell).not.toMatch(/responsive-preview/);
  });
});
