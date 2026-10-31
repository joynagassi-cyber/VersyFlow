import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('lecture biblique et thèmes', () => {
  const css = readFileSync('src/styles/globals.css', 'utf8');
  const view = readFileSync('src/components/bible/ManuscriptView.tsx', 'utf8');
  it('garde une surface de lecture opaque et désactive le flou pour les images et dégradés', () => {
    expect(css).toMatch(/html\[data-bg='image'\] \.reading-card \{[^}]*background: var\(--gc\)[^}]*backdrop-filter: none/);
    expect(css).toMatch(/html\[data-app-bg='gradient'\] \.reading-card \{[^}]*--gradient-wash[^}]*--app-bg-image[^}]*backdrop-filter: none/);
    expect(css).toContain("html[data-app-bg='gradient']:is([data-transparency='reduced'],[data-contrast='high']) .reading-card");
  });
  it('utilise les couleurs du thème pour le retour et les actions, et permet la sélection au clavier', () => {
    expect(css).toContain('.reading-header .full-screen-back { color: var(--color-text-primary)');
    expect(css).toContain('.reading-actions .reading-actions-row button { color: var(--color-text-primary)');
    expect(view).toContain('tabIndex={0}');
    expect(view).toContain("event.key === 'Enter'");
    expect(view).toContain("event.key === ' '");
  });
});
