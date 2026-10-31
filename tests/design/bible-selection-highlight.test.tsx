/**
 * Lecture biblique : sélection multiple et surlignage à couleur.
 *
 * Ce fichier verrouille quatre décisions prises en réaction à un rendu jugé
 * imparfait — chacune correspond à un défaut observable :
 *
 *  1. **Un appui sélectionne, un second désélectionne.** La sélection est un
 *     ENSEMBLE, pas un index unique : on peut surligner quatre versets d'un
 *     coup.
 *  2. **La sélection se voit par un trait fin pointillé, jamais par un fond.**
 *     Un fond entrait en collision avec le surlignage : un verset à la fois
 *     sélectionné et surligné ne montrait plus qu'une couleur.
 *  3. **Le surlignage a une couleur choisie**, pas une teinte imposée. Cinq
 *     pastilles ; la première est l'accent actif, donc celle qui s'applique
 *     par défaut.
 *  4. **Le lavis court sous tout le verset**, espaces compris, et reste fin :
 *     c'est un lavis, pas un bloc de couleur.
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(process.cwd(), 'src/styles/globals.css'), 'utf8');

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | { count: number }) =>
      typeof fallback === 'string' ? fallback : fallback ? `${fallback.count} versets` : key,
    i18n: { language: 'fr', resolvedLanguage: 'fr' },
  }),
}));
vi.mock('@/hooks/useSemanticTags', () => ({ useChapterSemanticTags: () => ({ tags: null, loading: false }) }));
vi.mock('@/components/bible/VerseActionBar', () => ({
  default: ({ verses }: { verses: number[] }) => <output data-testid="bar">{verses.join(',')}</output>,
}));

import {
  parseStoredHighlights,
  useHighlightStore,
  HIGHLIGHT_COLOR_IDS,
  DEFAULT_HIGHLIGHT_COLOR,
} from '@/store/highlight-store';
import { formatSelectionReference } from '@/lib/verse-selection';
import { MemoryRouter } from 'react-router-dom';
import ContinuousBibleReader from '@/components/bible/ContinuousBibleReader';
import type { BibleBookData } from '@/domains/bible/repository-local';

describe('magasin de surlignage', () => {
  beforeEach(() => {
    useHighlightStore.setState({ marks: {}, keys: [] });
  });

  it('relit l’ancien format (tableau) sans perdre un seul surlignage', () => {
    // v1 ne stockait qu'une liste de clés, sans couleur. La relire comme
    // « tout en accent » est la seule interprétation qui ne détruise rien.
    expect(parseStoredHighlights('["gen:1:1","gen:1:2"]')).toEqual({
      'gen:1:1': DEFAULT_HIGHLIGHT_COLOR,
      'gen:1:2': DEFAULT_HIGHLIGHT_COLOR,
    });
    expect(parseStoredHighlights(null)).toEqual({});
    expect(parseStoredHighlights('pas du json')).toEqual({});
  });

  it('relit le format versionné et rabat une couleur inconnue sur l’accent', () => {
    expect(parseStoredHighlights('{"v":2,"marks":{"gen:1:1":"gold"}}')).toEqual({ 'gen:1:1': 'gold' });
    expect(parseStoredHighlights('{"v":2,"marks":{"gen:1:1":"turquoise"}}')).toEqual({
      'gen:1:1': DEFAULT_HIGHLIGHT_COLOR,
    });
  });

  it('applique une couleur à plusieurs versets d’un coup', () => {
    const { mark } = useHighlightStore.getState();
    mark(['gen:1:1', 'gen:1:2', 'gen:1:3'], 'leaf');
    const state = useHighlightStore.getState();
    expect(state.keys).toHaveLength(3);
    expect(state.marks['gen:1:2']).toBe('leaf');
    expect(state.colorOf('gen:1:3')).toBe('leaf');
  });

  it('la couleur par défaut est celle de l’accent, et l’ordre des pastilles la met en tête', () => {
    expect(HIGHLIGHT_COLOR_IDS[0]).toBe('accent');
    expect(DEFAULT_HIGHLIGHT_COLOR).toBe('accent');
    useHighlightStore.getState().toggle('gen:1:9');
    expect(useHighlightStore.getState().marks['gen:1:9']).toBe('accent');
  });

  it('retire le surlignage de plusieurs versets', () => {
    useHighlightStore.getState().mark(['gen:1:1', 'gen:1:2'], 'sky');
    useHighlightStore.getState().clear(['gen:1:1', 'gen:1:2']);
    expect(useHighlightStore.getState().keys).toEqual([]);
  });
});

describe('référence d’une sélection multiple', () => {
  it('abrège une plage continue', () => {
    expect(formatSelectionReference('Genèse', 1, [3, 4, 5])).toBe('Genèse 1:3-5');
  });
  it('énumère les versets disjoints sans déborder', () => {
    expect(formatSelectionReference('Genèse', 1, [9, 3, 5])).toBe('Genèse 1:3.5.9');
  });
  it('garde la forme simple pour un seul verset', () => {
    expect(formatSelectionReference('Genèse', 1, [1])).toBe('Genèse 1:1');
  });
});

const books: BibleBookData[] = [
  {
    id: 'gen',
    name: { fr: 'Genèse' },
    testament: 'old',
    chapterCount: 1,
    chapters: [
      {
        number: 3,
        verses: [
          { number: 1, text: 'Premier verset' },
          { number: 2, text: 'Deuxième verset' },
          { number: 3, text: 'Troisième verset' },
          { number: 4, text: 'Quatrième verset' },
        ],
      },
    ],
  },
];

async function renderReader() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <MemoryRouter>
        <ContinuousBibleReader books={books} initialBookId="gen" initialChapter={3} translationId="lsg" />
      </MemoryRouter>,
    );
  });
  return { host, root };
}

describe('sélection multiple à l’écran', () => {
  it('quatre appuis sélectionnent quatre versets ; un second appui retire', async () => {
    useHighlightStore.setState({ marks: {}, keys: [] });
    const { host, root } = await renderReader();
    const verses = [...host.querySelectorAll<HTMLElement>('.manuscript-verse')];
    expect(verses).toHaveLength(4);

    for (const verse of verses) {
      await act(async () => verse.click());
    }
    expect(verses.every((v) => v.getAttribute('aria-pressed') === 'true')).toBe(true);
    // La barre reçoit la sélection entière, pas seulement le dernier appui.
    expect(host.querySelector('[data-testid="bar"]')?.textContent).toBe('1,2,3,4');

    // Second appui sur le deuxième : il sort de la sélection, les autres restent.
    await act(async () => verses[1].click());
    expect(verses[1].getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('[data-testid="bar"]')?.textContent).toBe('1,3,4');

    await act(async () => root.unmount());
    host.remove();
  });

  it('le numéral de chapitre est rendu une fois, en marge du texte', async () => {
    const { host, root } = await renderReader();
    const numeral = host.querySelector('.chapter-numeral');
    expect(numeral?.textContent).toBe('3');
    // Les numéros de versets restent des exposants dans le flux.
    expect(host.querySelectorAll('.verse-flow-number')).toHaveLength(3);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe('contrat visuel — ce que le CSS doit garantir', () => {
  /** Corps d'une règle, avec repli sur une recherche par sélecteur exact. */
  const rule = (selector: string): string => {
    const start = css.indexOf(selector);
    expect(start, `sélecteur absent : ${selector}`).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    return css.slice(open + 1, css.indexOf('}', open));
  };

  it('la sélection est un trait pointillé, sans fond', () => {
    const body = rule('.manuscript-verse.is-selected {');
    expect(body).toContain('dotted');
    expect(body).toContain('underline');
    // Le défaut d'origine : un fond qui masquait le surlignage.
    expect(body).not.toMatch(/background(-color)?\s*:/);
  });

  it('le surlignage suit la couleur choisie via data-hl, jamais une constante', () => {
    const body = rule('.manuscript-verse[data-hl] {');
    expect(body).toContain('var(--hl)');
    expect(body).not.toMatch(/--color-primary|#e6067a/);
    // Un lavis, pas un bloc : la bande colorée n'occupe qu'une fraction de la
    // hauteur de ligne.
    expect(body).toMatch(/transparent 0 58%/);
    expect(body).toContain('box-decoration-break: clone');
  });

  it('les cinq pastilles sont déclarées une seule fois, l’accent en tête', () => {
    expect(css).toContain("[data-hl='accent'] { --hl: var(--acc); }");
    for (const id of ['gold', 'leaf', 'sky', 'violet']) {
      expect(css, `pastille manquante : ${id}`).toContain(`[data-hl='${id}'] { --hl: var(--hl-${id}); }`);
    }
  });

  it('le numéro de verset est plus grand et prend la couleur de l’accent', () => {
    const body = rule('.verse-flow-number {');
    const size = Number(body.match(/font-size:\s*([\d.]+)em/)?.[1]);
    // 0,62 em avant : trop petit pour être lu d'un coup d'œil.
    expect(size).toBeGreaterThanOrEqual(0.74);
    expect(body).toContain('color: var(--acc-text');
  });

  it('la barre d’actions ne peut pas déborder : boutons à parts égales', () => {
    const row = rule('.verse-action-btn {');
    // `flex: 1 1 0` répartit la largeur disponible au lieu de la dépasser.
    expect(row).toContain('flex: 1 1 0');
    const bar = rule('.verse-bar {');
    expect(bar).toContain('max-width');
    // L'ancienne barre défilait horizontalement : c'est ce qui la rendait
    // « trop longue » et non compacte.
    expect(css).not.toMatch(/\.verse-bar-row \{[^}]*overflow-x:\s*auto/);
  });
});
