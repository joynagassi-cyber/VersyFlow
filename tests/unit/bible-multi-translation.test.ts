/**
 * P1B-1 — Multi-translation local (LSG + Ostervald).
 *
 * Invariants under test:
 *  1. The registry lists both French translations (lsg + ostervald) and
 *     `getByLanguage('fr')` returns both.
 *  2. The `BibleJsonFileSource` (Node fs) serves `lsg.json` from `data/bible/`
 *     and `LocalBibleRepository` exposes it book by book.
 *
 * Seul `lsg` est livré avec le dépôt (décision Chantier 2 : un seul dataset
 * versionné, 6,9 Mo, chargé par livre/chapitre). `ostervald.json` n'est plus
 * dans l'arbre ; le registre le référence comme traduction cataloguée, ce qui
 * ne garantit pas qu'il soit présent localement.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  BibleTranslationRegistry,
  DEFAULT_BIBLE_TRANSLATIONS,
  LocalBibleRepository,
} from '@/domains/bible';
import { BibleJsonFileSource } from '@/infrastructure/bible/bible-json-source';

describe('P1B-1 multi-translation registry', () => {
  it('lists lsg as the only available bundled translation', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    expect(registry.isAvailable('lsg')).toBe(true);
    // `available` = « livré dans le build », pas « licence vérifiée ». Seul
    // `lsg.json` est versionné : annoncer Ostervald disponible basculait
    // l'écran Profil vers une traduction dont chaque lecture échoue.
    expect(registry.isAvailable('ostervald')).toBe(false);
  });

  /**
   * Le garde qui manquait : `available: true` doit correspondre à un fichier
   * réellement présent. Sans lui, le registre a pu mentir pendant plusieurs
   * chantiers sans qu'aucun test ne s'en aperçoive.
   */
  it('n’annonce disponible que ce qui est livré sur le disque', () => {
    const root = path.resolve(__dirname, '../..');
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    const lying = registry
      .listTranslations()
      .filter((t) => t.available)
      .filter(
        (t) =>
          !fs.existsSync(path.join(root, 'data/bible', `${t.id}.json`)) &&
          !fs.existsSync(path.join(root, 'public/data/bible', t.id, 'index.json')),
      )
      .map((t) => t.id);
    expect(lying).toEqual([]);
  });

  it('getByLanguage("fr") returns both lsg and ostervald', () => {
    const registry = new BibleTranslationRegistry(DEFAULT_BIBLE_TRANSLATIONS);
    const fr = registry.getByLanguage('fr').map((t) => t.id);
    expect(fr).toEqual(expect.arrayContaining(['lsg', 'ostervald']));
  });

  it('the bundled dataset loads through the JSON file source', async () => {
    // Node fs path: reads data/bible/<id>.json from the project root.
    const source = new BibleJsonFileSource({ useNodeFs: true });
    const lsg = await source.load('lsg');
    expect(lsg.id).toBe('lsg');
    expect(lsg.books.length).toBe(66);
  }, 30_000);

  it('a reference resolves through the repository, verse by verse', async () => {
    const source = new BibleJsonFileSource({ useNodeFs: true });
    const repo = new LocalBibleRepository(source);
    const first = await repo.getVerse('lsg', 'gen', 1, 1);
    const second = await repo.getVerse('lsg', 'gen', 1, 2);
    expect(first?.text).toContain('Au commencement');
    expect(second?.text).toBeTruthy();
    expect(second?.text).not.toBe(first?.text);
  }, 30_000);

  it('an absent dataset rejects instead of returning empty data', async () => {
    // Le catalogue liste 56 traductions, le dépôt n'en versionne qu'une :
    // l'absence doit être une erreur explicite, pas un corpus vide.
    const source = new BibleJsonFileSource({ useNodeFs: true });
    await expect(source.load('ostervald')).rejects.toThrow();
  }, 30_000);
});
