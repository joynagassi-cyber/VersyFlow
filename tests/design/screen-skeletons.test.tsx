/**
 * Squelettes d'écran — la forme, pas le remplissage.
 *
 * Ce que ces tests tiennent, et qu'aucun autre ne tenait : un squelette doit
 * occuper la MÊME boîte que le contenu qu'il remplace. Un bloc générique
 * « titre + deux cartes » centré dans la page est un aveu — il ne dit ni la
 * grille, ni le nombre de lignes, ni la hauteur des rangées, et le contenu
 * saute à l'arrivée.
 *
 * Deux familles de vérifications :
 *   1. la couverture — chaque écran qui charge monte SON squelette, et le bloc
 *      générique ne traîne plus dans `app/` ;
 *   2. la géométrie — les compteurs rendus correspondent au contenu réel
 *      (trois tuiles là où il y a trois tuiles, cinq versets là où il y a cinq
 *      versets), et tout le décor est `aria-hidden` avec une annonce réelle.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  AnalyticsSkeleton,
  BibleReaderSkeleton,
  FamilyLeaderboardSkeleton,
  FamilyMemberSkeleton,
  FamilyMembersSkeleton,
  FlashcardSkeleton,
  HistorySkeleton,
  MemorizationSessionSkeleton,
  NotesSkeleton,
  ProgressSkeleton,
  ReviewQueueSkeleton,
  ReviewSessionSkeleton,
  ReviewSummarySkeleton,
  SemanticIndexSkeleton,
  SemanticReviewSkeleton,
  SemanticTagsSkeleton,
  SemanticTreeSkeleton,
  TranslationTextSkeleton,
  WorkspaceSkeleton,
} from '@/components/ui/ScreenSkeletons';

const root = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(root, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(root, rel)).isDirectory()) {
      if (['node_modules', 'dist', 'www', '__dev'].includes(entry)) continue;
      walk(rel, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(rel);
    }
  }
  return out;
}

const appFiles = walk('app');

/** Écrans qui possèdent une branche de chargement, et leur squelette. */
const COVERAGE: [string, string][] = [
  ['app/(tabs)/progress.tsx', 'ProgressSkeleton'],
  ['app/analytics/dashboard.tsx', 'AnalyticsSkeleton'],
  ['app/bible/explorer.tsx', 'BibleReaderSkeleton'],
  ['app/comparison/translation.tsx', 'TranslationTextSkeleton'],
  ['app/family/leaderboard.tsx', 'FamilyLeaderboardSkeleton'],
  ['app/family/member.tsx', 'FamilyMemberSkeleton'],
  ['app/family/members.tsx', 'FamilyMembersSkeleton'],
  ['app/profile/select.tsx', 'FamilySelectProfileSkeleton'],
  ['app/memorization/flashcard.tsx', 'FlashcardSkeleton'],
  ['app/memorization/session.tsx', 'MemorizationSessionSkeleton'],
  ['app/memorization/workspace.tsx', 'WorkspaceSkeleton'],
  ['app/notes.tsx', 'NotesSkeleton'],
  ['app/review/History.tsx', 'HistorySkeleton'],
  ['app/review/queue.tsx', 'ReviewQueueSkeleton'],
  ['app/review/session.tsx', 'ReviewSessionSkeleton'],
  ['app/review/summary.tsx', 'ReviewSummarySkeleton'],
  ['app/semantic/community.tsx', 'SemanticCommunitySkeleton'],
  ['app/semantic/concept.tsx', 'SemanticConceptSkeleton'],
  ['app/semantic/index.tsx', 'SemanticIndexSkeleton'],
  ['app/semantic/node.tsx', 'SemanticNodeSkeleton'],
  ['app/semantic/review.tsx', 'SemanticReviewSkeleton'],
  ['app/semantic/suggestions.tsx', 'SemanticSuggestionsSkeleton'],
  ['app/semantic/tags.tsx', 'SemanticTagsSkeleton'],
  ['app/semantic/tree.tsx', 'SemanticTreeSkeleton'],
  ['app/semantic/verse.tsx', 'SemanticVerseSkeleton'],
];

describe('squelettes — couverture', () => {
  it('chaque écran qui charge monte le squelette de sa propre forme', () => {
    const missing = COVERAGE.filter(([path, name]) => {
      const text = readFileSync(join(root, path), 'utf8');
      return !text.includes('@/components/ui/ScreenSkeletons') || !text.includes(`<${name}`);
    }).map(([path, name]) => `${path} → ${name}`);
    expect(missing).toEqual([]);
  });

  it('le bloc de chargement générique ne traîne plus dans un écran', () => {
    const offenders = appFiles.filter((path) => {
      const text = readFileSync(join(root, path), 'utf8');
      // Les commentaires citent la classe historique ; seul le code compte.
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      return code.includes('<LoadingBlock') || code.includes('<SkeletonScreen');
    });
    expect(offenders).toEqual([]);
  });

  it('aucun écran ne redessine un squelette gris à la main', () => {
    // Le défaut est un ÉLÉMENT de chargement fabriqué sur place : le même
    // bloc porte `aria-busy` et sa propre texture (`bg-surface-tint` ou une
    // pulsation). Chercher les deux mots n'importe où dans le fichier
    // accusait tout écran qui a une pastille `bg-surface-tint` et un
    // `aria-busy` ailleurs — c'est-à-dire la moitié des écrans corrects.
    const offenders = appFiles.filter((path) => {
      const text = readFileSync(join(root, path), 'utf8');
      const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      return [...code.matchAll(/<[a-z][^>]*>/g)].some((m) => {
        const tag = m[0];
        return (
          /aria-busy/.test(tag) &&
          /(bg-surface-tint|animate-pulse)/.test(tag) &&
          !/className="[^"]*\bskeleton\b/.test(tag)
        );
      });
    });
    expect(offenders).toEqual([]);
  });

  it('le balayage reste unique — pas d’animation d’opacité dans les écrans', () => {
    // Les commentaires racontent l'ancienne recette ; seul le code compte.
    const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const offenders = appFiles
      .concat(walk('src/components'))
      .filter((path) => code(readFileSync(join(root, path), 'utf8')).includes('animate-pulse'));
    expect(offenders).toEqual([]);
  });
});

describe('squelettes — géométrie', () => {
  const blocks = (container: HTMLElement) => container.querySelectorAll('.skeleton');

  it('annonce le chargement, masque le décor', () => {
    const { container } = render(<SemanticTagsSkeleton label="Chargement…" />);
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Chargement…').className).toContain('sr-only');
    // Tout ce qui est dessiné est décoratif.
    const decorations = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorations.length).toBeGreaterThan(0);
    blocks(container).forEach((block) => {
      expect(block.closest('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  it('une liste de tags montre six rangées, pas un bloc', () => {
    const { container } = render(<SemanticTagsSkeleton label="…" />);
    // Chaque rangée réelle est une carte `g2` avec un avatar.
    const rows = container.querySelectorAll('.g2');
    expect(rows.length).toBe(6);
    rows.forEach((row) => {
      expect(row.querySelector('.skeleton')).not.toBeNull();
    });
  });

  it('un arbre montre ses trois tuiles de synthèse', () => {
    const { container } = render(<SemanticTreeSkeleton label="…" />);
    const grid = container.querySelector('.grid.grid-cols-3');
    expect(grid?.children.length).toBe(3);
  });

  it('l’index sémantique garde ses trois rubriques', () => {
    const { container } = render(<SemanticIndexSkeleton label="…" />);
    expect(container.querySelectorAll('section').length).toBe(3);
  });

  it('la révision d’une branche garde ses rangées séparées', () => {
    const { container } = render(<SemanticReviewSkeleton label="…" />);
    expect(container.querySelectorAll('.divide-y > div').length).toBe(6);
  });

  it('le lecteur biblique dessine le flot continu par défaut (option flow)', () => {
    const { container } = render(<BibleReaderSkeleton label="…" />);
    // Lettrine de chapitre + 12 lignes de flot, pas de gouttières de verset.
    expect(container.querySelector('.h-14.w-10')).not.toBeNull();
    expect(container.querySelectorAll('.rounded-md.h-4, .h-4.rounded-md').length).toBeGreaterThanOrEqual(12);
    expect(container.querySelectorAll('.w-4.shrink-0.rounded-sm').length).toBe(0);
    // La vraie surface de lecture, pas une carte générique.
    expect(container.querySelector('.bible-card.reading-card')).not.toBeNull();
  });

  it('le lecteur biblique dessine des versets numérotés en option blocks', () => {
    const { container } = render(<BibleReaderSkeleton label="…" layout="blocks" />);
    // Cinq gouttières de numéro, une par verset factice.
    const gutters = container.querySelectorAll('.w-4.shrink-0.rounded-sm');
    expect(gutters.length).toBe(5);
    expect(blocks(container).length).toBeGreaterThan(15);
    expect(container.querySelector('.h-14.w-10')).toBeNull();
  });

  it('la file de révision garde ses pastilles et ses deux sections', () => {
    const { container } = render(<ReviewQueueSkeleton label="…" />);
    expect(container.querySelectorAll('section').length).toBe(2);
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(3);
  });

  it('la file utilise le flux Flexbox sans positionnement ni marge négative', () => {
    const { container } = render(<ReviewQueueSkeleton label="…" />);
    const classes = Array.from(container.querySelectorAll('[class]'))
      .map((element) => element.getAttribute('class') ?? '')
      .join(' ');
    expect(classes).not.toMatch(/\b(?:absolute|fixed|sticky)\b/);
    expect(classes).not.toMatch(/\b-m[trblxy]-/);
    expect(classes).toMatch(/flex/);
  });

  it('la session de révision garde sa barre et ses mots masqués', () => {
    const { container } = render(<ReviewSessionSkeleton label="…" />);
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(9);
    expect(container.querySelectorAll('.flex.flex-wrap.justify-center.gap-2 > *').length).toBe(9);
  });

  it('la session utilise le flux Flexbox sans positionnement ni marge négative', () => {
    const { container } = render(<ReviewSessionSkeleton label="…" />);
    const classes = Array.from(container.querySelectorAll('[class]'))
      .map((element) => element.getAttribute('class') ?? '')
      .join(' ');
    expect(classes).not.toMatch(/\b(?:absolute|fixed|sticky)\b/);
    expect(classes).not.toMatch(/\b-m[trblxy]-/);
    expect(classes).toMatch(/flex/);
  });

  it('le résumé garde ses quatre mesures', () => {
    const { container } = render(<ReviewSummarySkeleton label="…" />);
    expect(container.querySelectorAll('.grid.grid-cols-2 > div').length).toBe(4);
  });

  it('l’historique garde sa synthèse (trois mesures) et sa chronologie', () => {
    const { container } = render(<HistorySkeleton label="…" />);
    expect(container.querySelectorAll('.grid.grid-cols-3 > *').length).toBe(3);
    // Trois fiches de la chronologie, chacune avec sa pastille de note.
    expect(container.querySelectorAll('.rounded-2xl.bg-surface').length).toBe(3);
    expect(container.querySelectorAll('.border-s-2 > div').length).toBe(3);
    // Filtre par verset : « Tous les versets » + trois puces.
    expect(container.querySelectorAll('.flex.flex-wrap.gap-2 > .rounded-full').length).toBe(4);
  });

  it('les membres gardent une ligne par personne', () => {
    const { container } = render(<FamilyMembersSkeleton label="…" />);
    // MemberRow par défaut : avatar 40 px, ligne plus haute que 44 px.
    expect(container.querySelectorAll('.h-10.w-10').length).toBe(5);
    const rows = Array.from(container.querySelectorAll('li')).filter((node) =>
      node.className.includes('min-h-[52px]'),
    );
    expect(rows.length).toBe(5);
  });

  it('le classement garde ses lignes et leurs barres', () => {
    const { container } = render(<FamilyLeaderboardSkeleton label="…" />);
    // RankBadge h-7 w-7 + avatar 36 px + ProgressBar track h-2.
    expect(container.querySelectorAll('.h-7.w-7').length).toBe(6);
    expect(container.querySelectorAll('.h-9.w-9').length).toBe(6);
    expect(container.querySelectorAll('.h-2.overflow-hidden').length).toBe(6);
    // Le segmenté est TOUJOURS monté : le squelette ne le redessine pas.
    expect(container.querySelectorAll('.h-10.w-56').length).toBe(0);
  });

  it('la mémorisation garde la carte de verset et ses deux commandes', () => {
    const { container } = render(<MemorizationSessionSkeleton label="…" />);
    expect(container.querySelectorAll('.g2').length).toBe(1);
    expect(container.querySelectorAll('.rounded-full').length).toBeGreaterThanOrEqual(2);
  });

  it('l’atelier garde le rythme de lecture (cinq lignes, largeurs variées)', () => {
    const { container } = render(<WorkspaceSkeleton label="…" />);
    const widths = new Set(
      Array.from(container.querySelectorAll('.skeleton')).map((node) => node.className),
    );
    expect(widths.size).toBeGreaterThan(3);
  });

  it('la flashcard garde la boîte de la carte', () => {
    const { container } = render(<FlashcardSkeleton label="…" />);
    const boxes = Array.from(container.querySelectorAll('div')).filter((node) =>
      node.className.includes('380px'),
    );
    // Deux lames derrière + la carte active : trois boîtes identiques.
    expect(boxes.length).toBe(3);
    expect(container.querySelectorAll('.g1').length).toBe(2);
    expect(container.querySelectorAll('.rounded-2xl').length).toBe(2);
  });

  it('la fiche membre garde l’en-tête 56 px et ses deux grilles de tuiles', () => {
    const { container } = render(<FamilyMemberSkeleton label="…" />);
    expect(container.querySelector('.h-14.w-14')).not.toBeNull();
    expect(container.querySelectorAll('.grid.grid-cols-3').length).toBe(2);
    expect(container.querySelectorAll('.rounded-xl.bg-surface-tint').length).toBe(6);
    expect(container.querySelectorAll('.divide-y > div').length).toBe(3);
  });

  it('les notes gardent deux groupes', () => {
    const { container } = render(<NotesSkeleton label="…" />);
    expect(container.querySelectorAll('.rounded-xl').length).toBe(6);
  });

  it('l’analytique garde sa carte de tête et son classement', () => {
    const { container } = render(<AnalyticsSkeleton label="…" />);
    expect(container.querySelectorAll('.col-span-2').length).toBe(1);
    expect(container.querySelectorAll('.rounded-3xl').length).toBeGreaterThanOrEqual(3);
  });

  it('la progression garde ses quatre mesures et ses deux grilles de détail', () => {
    const { container } = render(<ProgressSkeleton label="…" />);
    expect(container.querySelectorAll('.progress-stat').length).toBe(4);
    expect(container.querySelectorAll('.progress-detail-grid').length).toBe(2);
    // Les six cartes de graphiques appartiennent à StatsDashboard : le
    // squelette de l'onglet ne les pré-dessine PAS (double emploi).
    expect(container.querySelectorAll('.stat-card').length).toBe(0);
  });

  it('une traduction en cours affiche deux lignes de texte, pas un spinner', () => {
    const { container } = render(<TranslationTextSkeleton label="Chargement…" />);
    expect(blocks(container).length).toBe(2);
    expect(container.innerHTML).not.toContain('animate-spin');
  });

  it('le tableau de bord couvre ses six vignettes et ses trois cadres larges', () => {
    const dash = readFileSync(join(root, 'src/components/charts/StatsDashboard.tsx'), 'utf8');
    for (const ghost of ['WeekStripGhost', 'RingGhost', 'DotMatrixGhost', 'GroupedBarsGhost', 'StackedBarGhost']) {
      expect(dash).toContain(ghost);
    }
    // Les trois `wide` du tableau chargé (heatmap, courbe, série).
    expect(dash).toContain('index === 0 || index === 1 || index === 8');
    expect(dash).toContain('stat-card--wide-visual');
  });

  it('l’amorçage montre la coquille, pas un mot centré', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const main = readFileSync(join(root, 'src/main.tsx'), 'utf8');
    // La forme est là avant même le premier octet de JS applicatif.
    expect(html).toContain('id="boot-splash"');
    expect(html).toMatch(/id="boot-splash"[^>]*role="status"[^>]*aria-busy="true"/);
    expect(html.match(/class="bs-card"/g)?.length).toBe(3);
    expect(html.match(/class="bs-pill"/g)?.length).toBe(5);
    // Même matériau : un balayage, coupé si le mouvement est réduit.
    expect(html).toContain('@keyframes bs-sweep');
    expect(html).toMatch(/prefers-reduced-motion: reduce[\s\S]{0,400}animation: none/);
    // Plus aucune couleur de marque en dur (l'ancien splash écrivait #d81b60).
    expect(html).not.toContain('#d81b60');
    expect(html).not.toMatch(/font-size:\s*22px/);
    // Le repli Suspense ne laisse plus un écran vide.
    expect(main).toContain('<Suspense fallback={<BootSplash />}>');
    expect(main).not.toContain('<Suspense fallback={null}>');
  });

  it('aucun squelette ne code une taille de police en dur', () => {
    const source = readFileSync(join(root, 'src/components/ui/ScreenSkeletons.tsx'), 'utf8');
    expect(source).not.toMatch(/text-\[\d/);
  });

  it('le fichier des formes ne dépend d’aucun écran', () => {
    const source = readFileSync(join(root, 'src/components/ui/ScreenSkeletons.tsx'), 'utf8');
    expect(source).not.toMatch(/from '@\/app/);
    expect(relative(root, join(root, 'src/components/ui/ScreenSkeletons.tsx'))).toBe(
      'src/components/ui/ScreenSkeletons.tsx',
    );
  });
});
