/**
 * Garde de la couche de fond (É1 du contrat « fond image + verre »).
 *
 * Ces tests lisent `src/styles/globals.css` en texte : sans navigateur, c'est
 * la seule façon de garantir que les régressions qui ont rendu le fond
 * invisible (image conditionnée à l'accent, flou de 32 px, inversion en mode
 * sombre, `body` opaque) ne reviennent pas.
 *
 * Ce qu'ils NE font pas : juger du rendu. Aucun pixel n'est calculé ici.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rawCss = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8');

/** CSS sans commentaires : les assertions négatives ne doivent pas mordre sur
 *  la prose (le commentaire qui EXPLIQUE la suppression de `invert()` contient
 *  le mot `invert(`). */
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, '');

/** Le bloc de la couche de fond, isolé du reste de la feuille. */
function layerBlock(): string {
  const start = rawCss.indexOf('É1 — LA couche de fond');
  expect(start).toBeGreaterThan(-1);
  const end = rawCss.indexOf('É1 — la chaîne de transparence', start);
  expect(end).toBeGreaterThan(start);
  return rawCss.slice(start, end);
}

describe('couche de fond — É1', () => {
  it('est une SEULE couche fixe, sous le contenu', () => {
    const block = layerBlock();
    expect(block).toContain('position: fixed');
    expect(block).toContain('inset: 0');
    expect(block).toContain('z-index: 0');
    // Le contenu passe au-dessus.
    expect(css).toMatch(/#root\s*\{[^}]*z-index:\s*1/);
  });

  it('ne colle jamais le fond au viewport (iOS)', () => {
    expect(css).not.toContain('background-attachment: fixed');
  });

  it('garde l’image nette : aucun flou destructeur ne subsiste', () => {
    expect(css).not.toMatch(/blur\(32px\)/);
    expect(css).not.toMatch(/blur\(22px\)/);
    expect(css).not.toMatch(/scale\(1\.12\)/);
  });

  it('n’inverse plus l’illustration en mode sombre', () => {
    expect(css).not.toMatch(/invert\(/);
    expect(css).not.toMatch(/hue-rotate\(/);
  });

  it('applique un voile dégradé de 0,15 à 0,45', () => {
    const block = layerBlock();
    expect(block).toContain('color-mix(in srgb, var(--color-background) 15%, transparent)');
    expect(block).toContain('color-mix(in srgb, var(--color-background) 45%, transparent)');
  });

  it('offre un repli couleur unie si `color-mix` manque', () => {
    const block = layerBlock();
    // L'image est posée par une déclaration séparée, hors du bloc @supports :
    // sans `color-mix`, seule la déclaration fautive disparaît.
    const beforeSupports = block.slice(0, block.indexOf('@supports'));
    expect(beforeSupports).toContain('background-color: var(--color-background)');
    expect(beforeSupports).toContain('background-image: var(--app-bg-image, var(--theme-image, none))');
  });

  it('rend transparente toute la chaîne jusqu’au scroll interne d’Ionic', () => {
    for (const selector of ['body', '#root', 'ion-app', 'ion-page', 'ion-content']) {
      expect(css).toContain(selector);
    }
    expect(css).toMatch(/ion-content\s*\{[^}]*--background:\s*transparent/);
    expect(css).toContain('ion-content::part(background)');
  });

  it('laisse les toiles d’écran transparentes sans toucher aux champs', () => {
    expect(css).toMatch(/\[class\*='bg-background'\]:is\(div\)\s*\{[^}]*background-color:\s*transparent/);
    // Les champs de saisie ne sont pas des <div> : ils gardent leur surface.
    expect(css).not.toMatch(/\[class\*='bg-background'\]\s*\{/);
  });
});
