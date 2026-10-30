import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('démonstration isolée', () => {
  it('affiche des données fictives uniquement dans le rendu du tableau de progression', () => {
    const screen = readFileSync('app/(tabs)/progress.tsx', 'utf8');
    expect(screen).toContain('const stats = demo ? DEMO_STATS : realStats');
    expect(screen).toContain('role="status"');
    expect(screen).toContain('aria-pressed={demo}');
    expect(screen).not.toMatch(/save\(DEMO_STATS|setStats\(DEMO_STATS/);
  });
});
