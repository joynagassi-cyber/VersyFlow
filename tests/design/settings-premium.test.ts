import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Contrat de l'onglet Réglages (refonte du 30/10).
 *
 * La page `app/settings/index.tsx` a été validée telle quelle. Cet onglet doit
 * en reprendre le langage — cartes, en-têtes de section, sélecteur de type de
 * version — et le partager en trois sections commutables. Le test verrouille
 * les trois choses qui peuvent silencieusement régresser : la sémantique
 * d'onglets, les destinations, et les surfaces du contrat de couleurs.
 */
describe('Réglages premium', () => {
  const source = readFileSync('app/(tabs)/settings.tsx', 'utf8');

  it('expose les trois sections comme de vrais onglets', () => {
    for (const id of ['params', 'data', 'profile']) expect(source).toContain(`id: '${id}'`);
    expect(source).toContain('role="tablist"');
    expect(source).toContain('role="tab"');
    expect(source).toContain('aria-selected={tab === def.id}');
    expect(source).toContain('aria-controls={`settings-panel-${def.id}`}');
    expect(source).toContain('role="tabpanel"');
  });

  it('reste pilotable au clavier (flèches et Début/Fin)', () => {
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      expect(source).toContain(`'${key}'`);
    }
  });

  it('place le panneau partagé hors du header flouté', () => {
    const panel = readFileSync('src/components/ui/BackgroundPanel.tsx', 'utf8');
    expect(panel).toContain('createPortal(<aside');
    expect(panel).toContain('document.body');
  });

  it('conserve toutes les destinations de l’ancienne page', () => {
    for (const route of [
      '/analytics/dashboard',
      '/tabs/progress',
      '/review/queue',
      '/settings/backup',
      '/review/history',
      '/collections',
      '/settings/appearance',
      '/profile/select',
      '/family/home',
    ]) {
      expect(source, route).toContain(route);
    }
  });

  it('reprend le langage visuel de la page validée', () => {
    expect(source).toContain('settings-heading');
    expect(source).toContain('settings-tabs');
    expect(source).toContain('settings-section-label');
    // Le sélecteur de type de version est le même contrôle que la page validée.
    expect(source).toContain('setBibleVersionType');
    expect(source).toContain("id: 'classical'");
    expect(source).toContain("id: 'modern'");
    expect(source).toContain("id: 'revised'");
  });

  it('n’invente pas de surface : pas de verre, cartes du contrat', () => {
    expect(source).not.toMatch(/className="glass/);
    expect(source).toMatch(/rounded-2xl bg-surface/);
  });

  it('affiche le badge et le niveau de mémorisation calculés, pas décoratifs', () => {
    expect(source).toContain('memorizationProgress(');
    expect(source).toContain('getAllMemorized()');
    expect(source).toContain('role="progressbar"');
  });
});

describe('niveau de mémorisation', () => {
  it('les paliers sont ordonnés et sans trou', async () => {
    const { MEMORIZATION_LEVELS } = await import('@/domains/progress/memorization-level');
    for (let i = 1; i < MEMORIZATION_LEVELS.length; i += 1) {
      expect(MEMORIZATION_LEVELS[i].min).toBeGreaterThan(MEMORIZATION_LEVELS[i - 1].min);
      expect(MEMORIZATION_LEVELS[i - 1].nextAt).toBe(MEMORIZATION_LEVELS[i].min);
    }
    expect(MEMORIZATION_LEVELS.at(-1)?.nextAt).toBeNull();
  });

  it('monte de palier exactement au seuil, et jamais avant', async () => {
    const { levelFor } = await import('@/domains/progress/memorization-level');
    expect(levelFor(0).id).toBe('graine');
    expect(levelFor(4).id).toBe('graine');
    expect(levelFor(5).id).toBe('pousse');
    expect(levelFor(14).id).toBe('pousse');
    expect(levelFor(15).id).toBe('racine');
    expect(levelFor(5000).id).toBe('cedre');
  });

  it('annonce la marche suivante et un ratio borné', async () => {
    const { memorizationProgress } = await import('@/domains/progress/memorization-level');
    const p = memorizationProgress(10);
    expect(p.next?.id).toBe('racine');
    expect(p.remaining).toBe(5);
    expect(p.ratio).toBeCloseTo(0.5, 5);
    const top = memorizationProgress(200);
    expect(top.next).toBeNull();
    expect(top.remaining).toBeNull();
    expect(top.ratio).toBeNull();
  });

  it('tolère les entrées absurdes sans casser l’affichage', async () => {
    const { memorizationProgress } = await import('@/domains/progress/memorization-level');
    expect(memorizationProgress(-3).total).toBe(0);
    expect(memorizationProgress(Number.NaN).level.id).toBe('graine');
    expect(memorizationProgress(12.9).total).toBe(12);
  });
});
