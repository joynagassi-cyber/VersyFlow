/**
 * Contrat Lot 1 — Atlas Dribbble & Élévation Bento (Socle des formes + Accueil Mobile/Desktop).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..', '..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

describe('Atlas Dribbble — planches des 7 lots séquentiels', () => {
  it('documente les 7 lots séquentiels et fournit les 8 planches visuelles curatées', () => {
    const atlas = read('docs/design/dribbble-ui-atlas.md');
    for (const lot of ['LOT 1', 'LOT 2', 'LOT 3', 'LOT 4', 'LOT 5', 'LOT 6', 'LOT 7']) {
      expect(atlas).toContain(lot);
    }
    for (const board of [
      'docs/artwork/dribbble/atlas-7-lots-overview.jpg',
      'docs/artwork/dribbble/lot-1-socle-accueil.jpg',
      'docs/artwork/dribbble/lot-2-bible-lecture.jpg',
      'docs/artwork/dribbble/lot-3-memorisation-fsrs.jpg',
      'docs/artwork/dribbble/lot-4-progression-analytique.jpg',
      'docs/artwork/dribbble/lot-5-famille-communaute.jpg',
      'docs/artwork/dribbble/lot-6-semantique-graphe.jpg',
      'docs/artwork/dribbble/lot-7-onboarding-profil-reglages.jpg',
    ]) {
      expect(existsSync(join(root, board)), board).toBe(true);
    }
  });
});

describe('Lot 1 — géométrie concentrique & Bento d’Accueil (Mobile 390 px + Desktop 1440 px)', () => {
  const css = read('src/styles/globals.css');
  const home = read('app/(tabs)/index.tsx');

  it('définit l’échelle de rayons concentriques et les briques .bento-inset / .pill-badge sans couleur littérale', () => {
    expect(css).toContain('--radius-card-hero: 28px;');
    expect(css).toContain('--radius-card: 24px;');
    expect(css).toContain('--radius-card-inner: 16px;');
    expect(css).toContain('--radius-pill: 999px;');
    expect(css).toMatch(/\.bento-inset\s*\{[\s\S]{0,240}?border-radius:\s*var\(--radius-card-inner\)/);
    expect(css).toMatch(/\.pill-badge,\s*\n?\.pill-badge-accent\s*\{[\s\S]{0,200}?border-radius:\s*var\(--radius-pill\)/);
  });

  it('structure la carte héro, les puits de série et la grille Bento 2+1 sur mobile (< 700 px)', () => {
    expect(home).toContain('home-greeting-top');
    expect(home).toContain('home-profile touch-target');
    expect(home).toContain('home-daily-art');
    expect(home).toContain('bento-inset home-ring-stage');
    expect(home).toContain('bento-inset home-week');
    expect(home).toContain('EmptyState');
    expect(css).toMatch(/@media \(max-width: 699px\)[\s\S]{0,700}?\.home-stat:nth-child\(3\)\s*\{\s*grid-column:\s*1\s*\/\s*-1/);
  });

  it('centre le dock d’onglets mobile sans l’étirer à vide sur les largeurs intermédiaires', () => {
    expect(css).toMatch(/\.mobile-tabs\s*\{[^}]*max-width:\s*460px;\s*margin-inline:\s*auto/);
  });
});
