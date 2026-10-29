/**
 * Duotone icons — contrat vérifié, pas déclaré.
 *
 * 1. Le rendu produit **deux calques** : un fond plein et doux, un trait net.
 * 2. Le calque plein reprend exactement la géométrie officielle de l'icône
 *    (aucune icône redessinée à la main, aucun nom inventé).
 * 3. Aucun fichier d'interface n'importe `@hugeicons/react` en direct :
 *    le seul point d'entrée est `DuoIcon`, donc aucune icône ne peut échapper
 *    au duotone.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home01Icon, PulseIcon } from '@hugeicons/core-free-icons';
import { DuoIcon } from '@/components/ui/DuoIcon';

const ROOT = resolve(__dirname, '../..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('icônes duotone', () => {
  it('rend un calque plein derrière un calque de trait', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, size: 20 }));
    expect(html).toContain('data-layer="duotone-fill"');
    expect(html).toContain('data-layer="duotone-line"');
    // Le fond est présent AVANT le trait dans le document.
    expect(html.indexOf('duotone-fill')).toBeLessThan(html.indexOf('duotone-line'));
  });

  it('applique l’opacité duotone au fond, jamais au trait', () => {
    const html = renderToStaticMarkup(
      createElement(DuoIcon, { icon: PulseIcon, secondaryOpacity: 0.2 }),
    );
    const fillGroup = html.slice(html.indexOf('duotone-fill'), html.indexOf('duotone-line'));
    expect(fillGroup).toContain('opacity="0.2"');
    expect(fillGroup).toContain('fill="currentColor"');
    expect(fillGroup).toContain('stroke="none"');
    // Le trait garde sa couleur : c'est lui qui porte le contraste.
    expect(html.slice(html.indexOf('duotone-line'))).toContain('currentColor');
  });

  it('conserve la géométrie officielle de l’icône (aucun tracé inventé)', () => {
    const paths = Home01Icon.map(([tag, attrs]) => `${tag}:${String(attrs.d)}`);
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }));
    for (const marker of paths) {
      const d = marker.split(':')[1];
      expect(html).toContain(d);
    }
  });

  it('reste muet pour les lecteurs d’écran sans libellé, et nommé avec', () => {
    const silent = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }));
    expect(silent).toContain('aria-hidden="true"');

    const named = renderToStaticMarkup(
      createElement(DuoIcon, { icon: Home01Icon, 'aria-label': 'Accueil' }),
    );
    expect(named).toContain('aria-label="Accueil"');
    expect(named).toContain('role="img"');
  });

  it('est le SEUL point d’entrée des icônes dans l’interface', () => {
    const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'src'))].filter(
      (f) => !f.endsWith('src/components/ui/DuoIcon.tsx'),
    );
    // Les imports de TYPES (`import type { IconSvgElement }`) sont autorisés :
    // ils ne dessinent rien. Seul un import de VALEUR échapperait au duotone.
    const direct = files.filter((f) => {
      const src = readFileSync(f, 'utf8');
      return /^import\s+\{[^}]*\}\s+from\s+'@hugeicons\/react'/m.test(src);
    });
    expect(direct).toEqual([]);
  });

  it('est utilisé par tous les écrans qui affichent une icône', () => {
    const screens = walk(join(ROOT, 'app'));
    const withIcons = screens.filter((f) => /@hugeicons\/core-free-icons/.test(readFileSync(f, 'utf8')));
    const withoutWrapper = withIcons.filter((f) => !/DuoIcon/.test(readFileSync(f, 'utf8')));
    expect(withIcons.length).toBeGreaterThan(30);
    expect(withoutWrapper).toEqual([]);
  });
});
