import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Mode sombre : ce que le test verrouille a changé le 30/10.
 *
 * L'ancienne recette mélangeait l'accent avec 45 % de neutre clair en sombre
 * (« atténue l'accent à partir du neutre »). À l'écran, « Lara Red » (#ff2056)
 * devenait rose saumon (#de7a92) et l'utilisateur concluait, à juste titre, que
 * le thème ne s'appliquait pas.
 *
 * Désormais : les neutres viennent du preset, l'accent reste la primaire
 * exacte, et le canvas est noir pur.
 */
describe('mode sombre', () => {
  const css = readFileSync('src/styles/globals.css', 'utf8');
  const dark =
    css.match(/:root\[data-theme='dark'\], \.appearance-preview\[data-theme='dark'\] \{([^}]+)\}/)?.[1] ?? '';

  it('prend ses neutres dans le preset, pas dans un gris figé', () => {
    expect(dark).toContain('--gc: var(--color-surface)');
    expect(dark).toContain('--tx: var(--color-text-primary)');
    expect(dark).not.toContain('#171717');
  });

  it('garde l’accent à sa valeur exacte (aucune désaturation)', () => {
    expect(dark).toContain('--acc: var(--color-primary)');
    expect(dark).not.toMatch(/--acc:\s*color-mix\(/);
  });

  it('peint le fond en noir pur (OLED)', () => {
    expect(css).toMatch(/html:root\[data-theme='dark'\]\[data-preset\] \{ --color-background: #000000; \}/);
  });

  it('conserve les garde-fous de marque', () => {
    expect(css).toContain("html[data-theme='dark'] .brand-tile img");
  });
});
