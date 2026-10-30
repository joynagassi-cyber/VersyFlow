import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Réglages premium', () => {
  const source = readFileSync('app/(tabs)/settings.tsx', 'utf8');
  it('conserve les trois sections et rend leur sélection accessible', () => {
    for (const id of ['data', 'params', 'profile']) expect(source).toContain(`id: '${id}'`);
    expect(source).toContain('aria-pressed={tab === d.id}');
    expect(source).toContain('aria-label={t(tabItem.labelKey, tabItem.label)}');
  });
  it('place le panneau partagé hors du header flouté', () => {
    const panel = readFileSync('src/components/ui/BackgroundPanel.tsx', 'utf8');
    expect(panel).toContain('createPortal(<aside');
    expect(panel).toContain('document.body');
  });
  it('conserve les destinations et utilise les surfaces du contrat', () => {
    for (const route of ['/analytics/dashboard', '/tabs/progress', '/review/queue', '/settings/backup', '/review/history', '/collections', '/settings/appearance', '/profile/select']) expect(source).toContain(route);
    expect(source).toContain('g1 settings-heading');
    expect(source).toContain('g2 settings-data-card');
    expect(source).toContain('g2 settings-group-card');
    expect(source).not.toMatch(/className="glass/);
  });
});
