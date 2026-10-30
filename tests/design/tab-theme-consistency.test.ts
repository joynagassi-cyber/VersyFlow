import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('cohérence de thème des onglets', () => {
  it('ne remplace pas le voile ou la couleur d’accent selon l’écran', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    for (const screen of ['explore-premium', 'progress-premium', 'settings-premium']) {
      expect(css).not.toMatch(new RegExp(`:has\\(\\.${screen}\\)::after`));
      expect(css).not.toMatch(new RegExp(`\\.${screen}\\s*\\{[^}]*--acc-text`));
    }
    expect(css).toContain("html[data-bg='image']::after {");
    expect(css).toContain('opacity: var(--veil);');
    expect(css).not.toContain(":has(.appearance-page)::after");
  });
});
