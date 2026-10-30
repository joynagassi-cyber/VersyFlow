/**
 * Coques d'appareils du laboratoire responsive.
 *
 * Ce qui est prouvé ici :
 *  - le téléphone et l'écran de bureau sont bien deux coques distinctes,
 *    chacune autour de SON aperçu ;
 *  - la coque est un DÉCOR : elle ne touche ni la largeur interne des iframes
 *    (390 / 1440 px, seules valeurs qui déclenchent les media queries), ni
 *    leur transformation ;
 *  - les éléments purement décoratifs (encoche, indicateur d'accueil, pied de
 *    l'écran) sont masqués aux technologies d'assistance ;
 *  - la taille réservée dans la page est la taille de l'appareil multipliée
 *    par l'échelle, donc la grille du laboratoire reste juste.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

import ResponsivePreviewPage from '../../app/__dev/responsive-preview';
import {
  DESKTOP_CHROME,
  PHONE_CHROME,
  deviceOuterSize,
  fitScale,
} from '../../src/dev/device-frames';

let container: HTMLDivElement | null = null;
let reactRoot: Root | null = null;

function mount() {
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

describe('coques — géométrie', () => {
  it('le téléphone ajoute la bordure des deux côtés', () => {
    expect(deviceOuterSize('mobile', 390, 844)).toEqual({
      width: 390 + PHONE_CHROME.bezel * 2,
      height: 844 + PHONE_CHROME.bezel * 2,
    });
  });

  it('l’écran de bureau ajoute bordure, menton, bras et semelle', () => {
    expect(deviceOuterSize('desktop', 1440, 900)).toEqual({
      width: 1440 + DESKTOP_CHROME.bezel * 2,
      height:
        900 +
        DESKTOP_CHROME.bezel * 2 +
        DESKTOP_CHROME.chin +
        DESKTOP_CHROME.neck +
        DESKTOP_CHROME.base,
    });
  });

  it('les deux coques n’ont pas la même forme : ce ne sont pas deux fois la même boîte', () => {
    const phone = deviceOuterSize('mobile', 390, 844);
    const desktop = deviceOuterSize('desktop', 1440, 900);
    // Le pied du bureau ajoute de la hauteur sous l'écran, pas le téléphone.
    expect(desktop.height - 900).toBeGreaterThan(phone.height - 844);
  });
});

describe('coques — rendu du laboratoire', () => {
  it('monte une coque de téléphone et un écran de bureau, une fois chacun', () => {
    mount();
    expect(document.querySelectorAll('[data-device="phone"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-device="monitor"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-device]')).toHaveLength(2);
  });

  it('chaque aperçu est À L’INTÉRIEUR de sa coque', () => {
    mount();
    const phone = document.querySelector('[data-device="phone"]');
    const monitor = document.querySelector('[data-device="monitor"]');
    const frames = [...document.querySelectorAll('iframe')] as HTMLIFrameElement[];
    expect(frames).toHaveLength(2);

    const mobile = frames.find((f) => new URL(f.src, 'http://localhost').searchParams.get('preview') === 'mobile');
    const desktop = frames.find((f) => new URL(f.src, 'http://localhost').searchParams.get('preview') === 'desktop');
    expect(phone?.contains(mobile!)).toBe(true);
    expect(monitor?.contains(desktop!)).toBe(true);
    // La version mobile n'est pas dans la coque de bureau, et réciproquement.
    expect(monitor?.contains(mobile!)).toBe(false);
    expect(phone?.contains(desktop!)).toBe(false);
  });

  it('la coque ne change pas la largeur interne des aperçus', () => {
    mount();
    const frames = [...document.querySelectorAll('iframe')] as HTMLIFrameElement[];
    const internal = frames.map((f) => f.style.width).sort();
    expect(internal).toEqual(['1440px', '390px']);
    // Aucune transformation sur l'iframe : la largeur de mise en page est
    // intacte, donc les media queries voient bien 390 / 1440 px.
    for (const frame of frames) {
      expect(frame.style.transform).toBe('');
    }
  });

  it('réserve la place de l’appareil après projection, pas celle de l’écran seul', () => {
    mount();
    const outer = deviceOuterSize('mobile', 390, 844);
    const box = document.querySelector('[data-device="phone"]')?.parentElement?.parentElement;
    const reserved = Number.parseFloat(box?.style.height ?? '0');
    expect(reserved).toBeGreaterThan(0);
    // La place réservée correspond à l'échelle effectivement appliquée à
    // l'appareil : si les deux divergent, la grille du laboratoire est fausse.
    const scale = Number.parseFloat(
      (box?.firstElementChild as HTMLElement).style.transform.replace(/[^0-9.]/g, ''),
    );
    expect(Math.round(reserved)).toBe(Math.round(outer.height * scale));
  });

  it('le décor est masqué aux lecteurs d’écran', () => {
    mount();
    // Encoche + indicateur d'accueil + pied : tous décoratifs.
    const hiddenInPhone = document.querySelectorAll('[data-device="phone"] [aria-hidden="true"]');
    expect(hiddenInPhone.length).toBeGreaterThanOrEqual(2);
    // Les iframes, elles, restent annoncées avec un titre explicite.
    for (const frame of document.querySelectorAll('iframe')) {
      expect(frame.getAttribute('title')).toContain('px');
    }
  });
});

describe('coques — échelle de projection', () => {
  it('ne dépasse jamais 1 : un petit appareil n’est pas agrandi', () => {
    expect(
      fitScale('mobile', 390, 844, { availableWidth: 2000, availableHeight: 2000 }),
    ).toBe(1);
  });

  it('se borne à la largeur quand la colonne est étroite', () => {
    const scale = fitScale('desktop', 1440, 900, { availableWidth: 700, availableHeight: 2000 });
    // 700 px de colonne pour un appareil de 1468 px de large.
    expect(scale).toBeCloseTo((700 - 16) / 1468, 5);
  });

  it('se borne à la hauteur quand la fenêtre est basse', () => {
    // Cas du problème signalé : un téléphone de 868 px de haut dans un panneau
    // de 400 px. Sans cette borne, on ne voyait que le haut de la coque.
    const scale = fitScale('mobile', 390, 844, { availableWidth: 2000, availableHeight: 400 });
    expect(scale).toBeLessThan(0.5);
    const outer = deviceOuterSize('mobile', 390, 844);
    expect(outer.height * scale).toBeLessThanOrEqual(400);
  });

  it('garde un plancher lisible même si la place manque', () => {
    expect(
      fitScale('desktop', 1440, 900, { availableWidth: 100, availableHeight: 100, min: 0.2 }),
    ).toBe(0.2);
  });
});
