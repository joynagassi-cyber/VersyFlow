import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home01Icon, FlameIcon } from '@/components/ui/solar-icons';
import { DuoIcon } from '@/components/ui/DuoIcon';

describe('icônes Solar duotone', () => {
  it('utilise la maison souriante Solar pour l’accueil', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, size: 20 }));
    expect(html).toContain('solar-home-smile-line-duotone');
    expect(html).toContain('solar-accent');
    // La densité du second calque ne doit PAS être figée sur la racine du SVG :
    // elle vient du thème (cf. `.solar.solar-accent` dans globals.css). Le
    // `var(--solar-secondary-opacity, .5)` des tracés est le repli de la
    // bibliothèque, donc surchargeable — c'est ce qu'on veut.
    if (html.includes('style="width')) {
      const rootStyle = html.slice(html.indexOf('style="width'), html.indexOf('"', html.indexOf('style="width') + 8));
      expect(rootStyle).not.toContain('--solar-secondary-opacity');
    }
  });
  it('utilise une variante bold duotone pour les distinctions', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: FlameIcon }));
    expect(html).toContain('solar-flame-bold-duotone');
  });
  it('rend les icônes décoratives muettes et nomme les autres', () => {
    expect(renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }))).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, 'aria-label': 'Accueil' }))).toContain('aria-label="Accueil"');
  });
  it('colore la seconde couche dès le repos, sans dépendre du survol', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    // Ancrage en début de ligne : `.bg-primary .solar.solar-accent` est une
    // exception de contraste, pas la règle de base.
    const base = css.match(/^\.solar\.solar-accent\s*\{([^}]*)\}/m);
    expect(base, 'la règle de base des icônes doit exister').not.toBeNull();
    const body = base![1];
    // Le défaut du second calque est `currentColor` : sans cette variable, les
    // deux calques ont la même teinte et le duotone redevient monochrome.
    expect(body).toContain('--solar-secondary-color: var(--acc)');
    // L'encre dérive du thème (aucune valeur figée, aucun preset cassé).
    expect(body).toMatch(/color:\s*color-mix\(in srgb,\s*var\(--tx\)/);
  });
});
