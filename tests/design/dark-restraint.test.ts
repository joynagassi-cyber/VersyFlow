import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('mode sombre discret', () => {
  it('atténue l’accent à partir du neutre et conserve les jetons existants', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    const dark = css.match(/:root\[data-theme='dark'\], \.appearance-preview\[data-theme='dark'\] \{([^}]+)\}/)?.[1] ?? '';
    expect(dark).toContain('--gc: #171717');
    expect(dark).toContain('color-mix(in srgb, var(--color-primary) 45%, var(--mut))');
    expect(dark).toContain('--tx: #f3f3f3');
    expect(css).toContain('html[data-theme=\'dark\'] .brand-tile img');
  });
});
