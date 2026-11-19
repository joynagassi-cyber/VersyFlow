import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Réglages premium', () => {
  const source = readFileSync('app/(tabs)/settings.tsx', 'utf8');
  it('conserve les trois sections et rend leur sélection accessible', () => {
    for (const id of ['data', 'params', 'profile']) expect(source).toContain(`id: '${id}'`);
    expect(source).toContain('aria-pressed={tab === d.id}');
    // Le nom accessible de l'interrupteur de visibilité d'onglet vit désormais
    // sur la commande partagée `ui/Switch` (rôle, état et cible de 40 px).
    expect(source).toMatch(/<Switch[\s\S]{0,200}?label=\{t\(tabItem\.labelKey, tabItem\.label\)\}/);
  });
  it('place le panneau partagé hors du header flouté', () => {
    const panel = readFileSync('src/components/ui/BackgroundPanel.tsx', 'utf8');
    expect(panel).toContain('createPortal(<aside');
    expect(panel).toContain('document.body');
  });
  it('conserve les destinations et utilise les surfaces du contrat', () => {
    for (const route of ['/analytics/dashboard', '/tabs/progress', '/review/queue', '/settings/backup', '/review/history', '/collections', '/settings/session', '/settings/reminders', '/profile/select']) expect(source).toContain(route);
    // Un seul hub : l'onglet ne recopie plus apparence / confidentialité / à-propos,
    // il y renvoie en une ligne.
    expect(source).toContain("navigate('/settings')");
    expect(source).not.toContain("navigate('/settings/privacy')");
    expect(source).not.toContain("navigate('/settings/about')");
    expect(source).toContain('g1 tab-heading settings-heading');
    expect(source).toContain('g2 settings-data-card');
    expect(source).toContain('g2 settings-group-card');
    expect(source).not.toMatch(/className="glass/);
  });
});
