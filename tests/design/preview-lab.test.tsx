/**
 * Laboratoire responsive — comportement du panneau de commande.
 *
 * Ce qui est prouvé ici, et qui compte pour la comparaison côte à côte :
 *  - deux iframes sont montées, avec les **largeurs internes** 390 et 1440 px
 *    (c'est la largeur interne qui déclenche les vraies media queries) ;
 *  - changer d'écran envoie **la même navigation aux deux cadres** ;
 *  - un cadre gelé ne reçoit plus la navigation, l'autre continue ;
 *  - les messages sont adressés à `window.location.origin`, jamais à `*`.
 *
 * jsdom ne charge pas le contenu des iframes : on remplace `contentWindow`
 * par un espion, ce qui suffit à vérifier le protocole de commande.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';

// React 18 exige ce drapeau pour que `act()` soit reconnu par l'environnement
// de test (sinon jsdom émet un avertissement à chaque rendu).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import ResponsivePreviewPage from '../../app/__dev/responsive-preview';

let container: HTMLDivElement | null = null;
let reactRoot: Root | null = null;

interface Sent {
  data: Record<string, unknown>;
  targetOrigin: string;
}

function mount() {
  const sent: Record<'mobile' | 'desktop', Sent[]> = { mobile: [], desktop: [] };
  container = document.createElement('div');
  document.body.appendChild(container);
  reactRoot = createRoot(container);
  act(() => {
    reactRoot?.render(
      <MemoryRouter initialEntries={['/__dev/responsive-preview']}>
        <ResponsivePreviewPage />
      </MemoryRouter>,
    );
  });

  // Remplace le contentWindow de chaque iframe par un espion.
  const frames = [...document.querySelectorAll('iframe')] as HTMLIFrameElement[];
  expect(frames).toHaveLength(2);
  for (const frame of frames) {
    const role = new URL(frame.src, 'http://localhost').searchParams.get('preview');
    const key = role === 'desktop' ? 'desktop' : 'mobile';
    Object.defineProperty(frame, 'contentWindow', {
      configurable: true,
      value: {
        postMessage: (data: Record<string, unknown>, targetOrigin: string) => {
          sent[key].push({ data, targetOrigin });
        },
      },
    });
  }
  return { sent, frames };
}

afterEach(() => {
  if (reactRoot) {
    act(() => reactRoot?.unmount());
    reactRoot = null;
  }
  container?.remove();
  container = null;
  document.body.innerHTML = '';
});

describe('laboratoire — deux contextes réels', () => {
  it('monte deux iframes avec les largeurs 390 et 1440 px', () => {
    const { frames } = mount();
    const widths = frames.map((frame) => frame.style.width).sort();
    expect(widths).toEqual(['1440px', '390px']);
    // Les rôles sont transmis à la page hôte, qui isole le stockage.
    const roles = frames
      .map((frame) => new URL(frame.src, 'http://localhost').searchParams.get('preview'))
      .sort();
    expect(roles).toEqual(['desktop', 'mobile']);
  });
});

describe('laboratoire — synchronisation des commandes', () => {
  it('un changement d’écran navigue les deux cadres vers la même route', () => {
    const { sent } = mount();

    const select = document.querySelector('select') as HTMLSelectElement;
    act(() => {
      select.value = '/bible/explorer';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    for (const role of ['mobile', 'desktop'] as const) {
      const navigations = sent[role].filter((m) => m.data.type === 'vf:preview:navigate');
      expect(navigations.at(-1)?.data.path).toBe('/bible/explorer');
    }
  });

  it('un cadre gelé cesse de suivre la sélection, pas l’autre', () => {
    const { sent } = mount();

    const freezeButtons = [...document.querySelectorAll('button')].filter(
      (button) => button.getAttribute('aria-pressed') !== null,
    );
    expect(freezeButtons.length).toBe(2);
    act(() => {
      freezeButtons[0].click();
    });

    const select = document.querySelector('select') as HTMLSelectElement;
    act(() => {
      select.value = '/notes';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const mobileNav = sent.mobile.filter((m) => m.data.type === 'vf:preview:navigate');
    const desktopNav = sent.desktop.filter((m) => m.data.type === 'vf:preview:navigate');
    // Le premier cadre est gelé (ordre de rendu : mobile, puis desktop).
    expect(mobileNav.some((m) => m.data.path === '/notes')).toBe(false);
    expect(desktopNav.some((m) => m.data.path === '/notes')).toBe(true);
  });

  it('n’adresse aucun message à « * »', () => {
    const { sent } = mount();
    const select = document.querySelector('select') as HTMLSelectElement;
    act(() => {
      select.value = '/notes';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    for (const role of ['mobile', 'desktop'] as const) {
      for (const message of sent[role]) {
        expect(message.targetOrigin).not.toBe('*');
        expect(message.targetOrigin).toBe(window.location.origin);
      }
    }
  });
});
