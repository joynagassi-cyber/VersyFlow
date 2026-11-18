/**
 * Mémorisation — de l'entrée « Mémoriser » au verset affiché.
 *
 * Bug corrigé ici (reproduit avant correctif) : les cinq points d'entrée
 * « Mémoriser » ouvraient `/memorization/session` **sans coordonnées** et
 * l'écran répondait « verset non disponible ». La fonctionnalité était morte
 * par son propre bouton.
 *
 * La matière du test est `data/bible/lsg.sample.json` : texte **réel** de la
 * LSG 1910 (254 versets, 43 Ko) au schéma exact du jeu complet, fabriqué par
 * `node scripts/bible/make-sample.mjs`. Pas de verset inventé.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';
import MemorizationSession from '../../app/memorization/session';
import { STARTER_PASSAGES, passageQuery } from '@/domains/bible/starter-passages';
import { parsePassageReference } from '@/components/memorization/VersePicker';

const SAMPLE_PATH = resolve(__dirname, '../../data/bible/lsg.sample.json');
const SAMPLE = readFileSync(SAMPLE_PATH, 'utf8');

/** Sert l'échantillon à la place de `data/bible/lsg.json`. */
function stubBibleFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(SAMPLE, { status: 200, headers: { 'content-type': 'application/json' } })),
  );
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

beforeEach(() => {
  stubBibleFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('échantillon LSG', () => {
  it('garde le schéma du vrai jeu de données et du texte réel', () => {
    const data = JSON.parse(SAMPLE) as {
      id: string;
      sample?: boolean;
      books: { id: string; chapters: { number: number; verses: { text: string }[] }[] }[];
    };
    expect(data.id).toBe('lsg');
    expect(data.sample).toBe(true);
    expect(data.books).toHaveLength(66);
    const john = data.books.find((b) => b.id === 'joh');
    const chapter3 = john?.chapters.find((c) => c.number === 3);
    expect(chapter3?.verses[15].text).toMatch(/Dieu a tant aimé le monde/);
  });

  it('ne contient aucun marqueur de conversion resté en clair', () => {
    // Avant réparation, 2 037 versets affichaient « j Il est écrit:j* » et 223
    // autres « \\b », « \\pi1 », « \\qs … \\qs* » : des lettres isolées en
    // plein texte. Voir scripts/bible/normalize-bible-datasets.mjs (règles 5-6).
    const data = JSON.parse(SAMPLE) as { books: { chapters: { verses: { text: string }[] }[] }[] };
    const dirty: string[] = [];
    for (const book of data.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (/\\|\*/.test(verse.text) || /(?:^|[\s(«“"'])j(?=[\s.,;:!?])/.test(verse.text)) {
            dirty.push(verse.text.slice(0, 60));
          }
        }
      }
    }
    expect(dirty).toEqual([]);
  });

  it('couvre tous les passages proposés par l’écran de choix', () => {
    const data = JSON.parse(SAMPLE) as {
      books: { id: string; chapters: { number: number; verses: unknown[] }[] }[];
    };
    const missing: string[] = [];
    for (const passage of STARTER_PASSAGES) {
      const book = data.books.find((b) => b.id === passage.bookId);
      const chapter = book?.chapters.find((c) => c.number === passage.chapter);
      if (!chapter || chapter.verses.length < passage.verseEnd) {
        missing.push(passage.reference);
      }
    }
    expect(missing).toEqual([]);
  });

  it('se charge par le vrai lecteur de fichiers (fetch + parsing)', async () => {
    const source = new BibleJsonFileSource({ fetchImpl: globalThis.fetch });
    const data = await source.load('lsg');
    expect(data.books.length).toBeGreaterThan(60);
    expect(JSON.stringify(data.books)).toContain('L’Éternel est mon berger');
  });
});

describe('entrée « Mémoriser » sans coordonnées', () => {
  const renderFlow = (initial: string) =>
    render(
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route
            path="/memorization/session"
            element={
              <>
                <LocationProbe />
                <MemorizationSession />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('ouvre un choix de passage au lieu d’une erreur', async () => {
    renderFlow('/memorization/session');
    expect(await screen.findByRole('heading', { name: /Passages suggérés/i })).toBeTruthy();
    expect(screen.queryByText(/non disponible/i)).toBeNull();
  });

  it('propose les dix passages et la référence libre', () => {
    renderFlow('/memorization/session');
    for (const passage of STARTER_PASSAGES) {
      expect(screen.getAllByText(passage.reference).length).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText(/Référence/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Parcourir la Bible/i })).toBeTruthy();
  });

  it('démarre la session sur un passage suggéré', async () => {
    // Bout en bout : aucun paramètre → sélecteur → clic → verset réel affiché.
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(SAMPLE, { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const { default: FreshSession } = await import('../../app/memorization/session');

    render(
      <MemoryRouter initialEntries={['/memorization/session']}>
        <Routes>
          <Route
            path="/memorization/session"
            element={
              <>
                <LocationProbe />
                <FreshSession />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Jean 3:16/i }));

    await waitFor(
      () => {
        const location = screen.getByTestId('location').textContent ?? '';
        expect(location).toContain('bookId=joh');
        expect(location).toContain('chapter=3');
        expect(location).toContain('verseStart=16');
      },
      { timeout: 15000 },
    );

    // Le sélecteur doit laisser place à la vraie session (texte LSG).
    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/Dieu a tant aimé le monde/);
      },
      { timeout: 15000 },
    );
    expect(screen.queryByRole('heading', { name: /Passages suggérés/i })).toBeNull();
  }, 40000);
});

describe('session avec coordonnées', () => {
  const query = passageQuery(STARTER_PASSAGES[0]);

  it('affiche le verset LSG réel, sans erreur', async () => {
    // `bible-text-service` construit son unique instance de repository à
    // l'import du module : il faut donc le réimporter APRÈS avoir remplacé
    // `fetch`, sinon le lecteur garde le vrai fetch et cherche un fichier
    // réseau inexistant en jsdom.
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(SAMPLE, { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const { default: FreshSession } = await import('../../app/memorization/session');

    render(
      <MemoryRouter initialEntries={[`/memorization/session?${query}`]}>
        <FreshSession />
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        expect(document.body.textContent).toMatch(/Dieu a tant aimé le monde|Jean 3:16/);
      },
      { timeout: 18000 },
    );
    expect(document.body.textContent).not.toMatch(/non disponible/i);
  }, 20000);
});

describe('référence libre', () => {
  it('comprend les formes courantes', () => {
    expect(parsePassageReference('Jean 3:16')).toMatchObject({ bookId: 'joh', chapter: 3, verseStart: 16 });
    expect(parsePassageReference('Psaume 23:1-6')).toMatchObject({ bookId: 'psa', verseEnd: 6 });
    expect(parsePassageReference('Genèse 1')).toMatchObject({ bookId: 'gen', chapter: 1, verseStart: 1 });
  });

  it('refuse une référence inconnue', () => {
    expect(parsePassageReference('XYZ 99:1')).toBeNull();
  });
});
