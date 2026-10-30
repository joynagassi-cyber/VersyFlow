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
    expect(html).toContain('--solar-secondary-opacity:0.5');
  });
  it('utilise une variante bold duotone pour les distinctions', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: FlameIcon }));
    expect(html).toContain('solar-flame-bold-duotone');
  });
  it('rend les icônes décoratives muettes et nomme les autres', () => {
    expect(renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }))).toContain('aria-hidden="true"');
    expect(renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, 'aria-label': 'Accueil' }))).toContain('aria-label="Accueil"');
  });
  it('suit la variable de couleur du thème sans survol', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    expect(css).toMatch(/\.solar\.solar-accent\s*\{[^}]*color:\s*var\(--color-primary\)/);
  });
});
