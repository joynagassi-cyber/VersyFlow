/**
 * Contrat des CHARGEMENTS et des ÉTATS VIDES.
 *
 * L'audit, en comptant : 6 écrans avaient déjà un squelette, mais 3 autres
 * affichaient encore une PHRASE à la place du contenu (« Chargement des
 * statistiques… »), posée dans une carte de la taille du vrai contenu. Le
 * résultat est le même à chaque fois : la page saute quand les données
 * arrivent, et rien ne dit qu'un chargement est en cours à un lecteur d'écran.
 *
 * Ce fichier verrouille la règle : pendant un chargement, l'écran garde la
 * forme du contenu (squelette) et l'annonce (`role="status"` + `aria-busy`).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');

describe('chargements — la forme du contenu, pas une phrase', () => {
  it('les tableaux de bord premium chargent en squelette', () => {
    const progress = read('app/(tabs)/progress.tsx');
    expect(progress).toContain('<Skeleton');
    expect(progress, 'le squelette garde la grille des tuiles').toContain('progress-stat-grid');
    expect(progress, 'et celle des deux cartes').toContain('progress-detail-grid');
    expect(progress, 'le chargement est annoncé').toMatch(/role="status"[\s\S]{0,120}?aria-busy="true"/);
    expect(progress, 'le libellé reste lisible par un lecteur d’écran').toContain('sr-only');
  });

  it('aucun écran ne remplace son contenu par le seul mot « Chargement »', () => {
    // Un bouton peut afficher « Chargement… » pendant qu'il agit ; un ÉCRAN ne
    // le fait pas. On ne cherche donc que les nœuds racine de section.
    const offenders = [
      'app/(tabs)/progress.tsx',
      'app/family/leaderboard.tsx',
      'app/family/members.tsx',
      'app/memorization/flashcard.tsx',
      'app/analytics/dashboard.tsx',
    ].filter((path) => /<section[^>]*role="status"[^>]*>\{t\('common\.loading|progress\.loading'\)\}<\/section>/.test(read(path)));
    expect(offenders).toEqual([]);
  });
});

describe('états vides — une seule primitive', () => {
  it('`EmptyState` porte un titre de niveau 2 et un rôle annoncé', () => {
    const text = read('src/components/ui/EmptyState.tsx');
    expect(text).toContain('role="status"');
    expect(text).toContain('empty-title');
    expect(text, 'le titre est un vrai titre').toMatch(/<h2|<h3/);
  });

  it('`LoadingBlock` annonce le chargement et son libellé', () => {
    const text = read('src/components/ui/Skeleton.tsx');
    expect(text).toMatch(/role="status"[\s\S]{0,120}?aria-live="polite"[\s\S]{0,80}?aria-busy="true"/);
    expect(text).toContain('<SkeletonScreen />');
  });

  it('les surfaces de squelette viennent du thème, pas d’un gris figé', () => {
    const css = read('src/styles/globals.css');
    expect(css).toMatch(/\.skeleton\s*\{[^}]*var\(--tx/);
  });
});
