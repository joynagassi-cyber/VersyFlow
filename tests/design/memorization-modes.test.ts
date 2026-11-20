/**
 * L'atelier de mémorisation — les quatre corrections du 2026-11-19.
 *
 * Ce que ces tests tiennent, et qu'aucun autre ne tenait : les quatre modes
 * de l'atelier n'avaient AUCUN test. Les défauts corrigés ici étaient donc
 * libres de revenir :
 *
 *  1. **masquage** — les mots masqués doivent être des champs à remplir, et
 *     le niveau doit pouvoir monter ; auparavant le texte restait lisible sous
 *     le soulignement et aucun niveau n'existait ;
 *  2. **flashcard** — le recto ne montre que la référence ; le texte n'arrive
 *     qu'au retournement, et la carte interdit la sélection de texte ;
 *  3. **écrire** — la référence se retrouve de mémoire dans une case dédiée,
 *     et son verdict est rendu séparément du texte ;
 *  4. **en-tête** — aucun écran d'exercice n'affiche le verset avant l'effort.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MASK_LEVELS,
  maskedCountFor,
  spreadMaskedIndices,
} from '@/components/memorization/ModeMask';
import { workspaceStatusTone } from '@/domains/memorization/workspace-status';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
/** Le code sans les commentaires : un commentaire ne rend rien à l'écran. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const css = code(read('src/styles/globals.css'));

describe('masquage — des cases vides, et des niveaux qui montent', () => {
  it('trois paliers, du plus léger au complet', () => {
    expect(MASK_LEVELS).toEqual([1 / 3, 2 / 3, 1]);
  });

  it('le nombre de mots à retrouver augmente à chaque niveau', () => {
    const total = 12;
    const counts = ([1, 2, 3] as const).map((level) => maskedCountFor(level, total));
    expect(counts).toEqual([4, 8, 12]);
    // Strictement croissant : le niveau sert à demander plus.
    expect(counts[0]).toBeLessThan(counts[1]);
    expect(counts[1]).toBeLessThan(counts[2]);
  });

  it('un verset très court ne tombe jamais à zéro mot masqué', () => {
    expect(maskedCountFor(1, 2)).toBe(1);
    expect(maskedCountFor(1, 1)).toBe(1);
    expect(maskedCountFor(3, 0)).toBe(0);
  });

  it('les mots masqués sont répartis, pas agglutinés en tête', () => {
    const indices = spreadMaskedIndices(4, 12);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(new Set(indices).size).toBe(4);
    expect(Math.min(...indices)).toBeLessThan(3);
    expect(Math.max(...indices)).toBeGreaterThan(8);
  });

  it('les mots les plus oubliés passent devant, sans doublon', () => {
    const indices = spreadMaskedIndices(3, 10, [7, 2, 7, 99]);
    expect(indices).toContain(7);
    expect(indices).toContain(2);
    expect(new Set(indices).size).toBe(3);
  });

  it('tout masquer rend tous les indices', () => {
    expect(spreadMaskedIndices(5, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(spreadMaskedIndices(9, 5).length).toBe(5);
  });

  it('le composant écrit dans des champs, pas sous un soulignement', () => {
    const source = code(read('src/components/memorization/ModeMask.tsx'));
    // La case existe, elle est étiquetée, et elle porte un verdict.
    expect(source).toContain('mem-mask-input');
    expect(source).toMatch(/aria-label=\{t\('workspace\.maskedWordInput'/);
    expect(source).toContain('aria-invalid');
    // Le niveau est réglable dans les deux sens, avec une explication liée.
    expect(source).toContain('workspace.increaseMask');
    expect(source).toContain('workspace.decreaseMask');
    expect(source).toMatch(/aria-describedby="mem-mask-level-hint"/);
    // Le mot attendu n'est plus rendu DANS le mot masqué.
    expect(source).not.toMatch(/isMasked && !verifiedWord/);
  });

  it('un champ masqué n’affiche jamais le mot attendu', () => {
    // La valeur d'un mot masqué n'est pas dans le DOM : le champ démarre vide
    // et ne reçoit que la saisie de l'utilisateur.
    expect(css).toContain('.mem-mask-input');
    expect(css).not.toMatch(/\.mem-mask-input[^}]*color:\s*transparent/);
  });
});

describe('flashcard — la référence d’abord, le texte au clic', () => {
  const source = code(read('src/components/memorization/ModeCards.tsx'));

  it('le recto ne porte que la référence', () => {
    const front = source.slice(source.indexOf('mem-flashcard-face front'));
    const verso = front.slice(0, front.indexOf('mem-flashcard-face back'));
    expect(verso).toContain('mem-flashcard-reference');
    expect(verso).not.toContain('{currentVerse}');
  });

  it('le verso porte le texte attendu', () => {
    const back = source.slice(source.indexOf('mem-flashcard-face back'));
    expect(back).toContain('{currentVerse}');
  });

  it('la carte interdit la sélection de texte', () => {
    const rule = css.slice(css.indexOf('.mem-flashcard {'));
    expect(rule.slice(0, 700)).toMatch(/user-select:\s*none/);
  });

  it('le retournement se défait au clavier, avec le focus déplacé', () => {
    expect(source).toContain('mem-flashcard-face back');
    expect(source).toMatch(/onClick=\{\(\) => setFlipped\(false\)\}/);
    expect(source).toContain('backButton.current?.focus()');
  });
});

describe('écrire — la référence se retrouve de mémoire', () => {
  const source = code(read('src/components/memorization/ModeWrite.tsx'));

  it('une case dédiée reçoit la référence, étiquetée', () => {
    expect(source).toContain('mem-write-reference');
    expect(source).toMatch(/htmlFor="mem-write-reference"/);
    expect(source).toContain('referenceFromMemory');
  });

  it('la référence n’est plus affichée avant la vérification', () => {
    // L'ancien encart « TITRE DU VERSET » rendait `referenceLabel` en clair :
    // il donnait la réponse à la question posée juste en dessous.
    expect(source).not.toMatch(/titleCase[\s\S]{0,160}referenceLabel/);
  });

  it('son verdict est séparé de celui du texte', () => {
    expect(source).toContain('referenceCheck');
    expect(source).toMatch(/compareWrittenRecall\(written, text\)/);
    expect(source).toMatch(/normalize\(givenReference\) === engine\.normalize\(referenceLabel\)/);
  });
});

describe('en-tête — aucun verset lisible avant l’effort', () => {
  it('le rappel écrit ne montre pas le texte attendu en haut', () => {
    const source = code(read('app/memory/recall-writing.tsx'));
    const beforeCompare = source.slice(0, source.indexOf('{result && ('));
    expect(beforeCompare).not.toContain('{expectedVerse}');
  });

  it('le flashcard incrémental ne déballe pas le verset d’emblée', () => {
    const source = code(read('app/memory/flashcard.tsx'));
    expect(source).not.toMatch(/font-semibold text-primary">\{text\}/);
  });

  it('la session de mémorisation garde son texte : c’est son exercice', () => {
    // Contre-épreuve : la règle vise l'énoncé d'une question, pas un écran
    // dont le texte EST le contenu (session, lecteur biblique).
    const session = code(read('app/memorization/session.tsx'));
    expect(session).toContain('engine.getCurrentVerseData()');
  });
});

describe('statut de l’atelier — une règle sortie du composant', () => {
  const now = 1_000_000;
  it('sans record : nouveau', () => {
    expect(workspaceStatusTone({ record: null, nextReviewAt: null, now })).toBe('new');
  });
  it('échéance dépassée : à revoir, même maîtrisé', () => {
    expect(
      workspaceStatusTone({
        record: { status: 'mastered' },
        nextReviewAt: new Date(now - 1),
        now,
      }),
    ).toBe('due');
  });
  it('maîtrisé et pas encore échu : consolidation', () => {
    expect(
      workspaceStatusTone({
        record: { status: 'mastered' },
        nextReviewAt: new Date(now + 1),
        now,
      }),
    ).toBe('consolidated');
  });
  it('en cours : à revoir', () => {
    expect(
      workspaceStatusTone({
        record: { status: 'learning' },
        nextReviewAt: new Date(now + 86_400_000),
        now,
      }),
    ).toBe('due');
  });
});
