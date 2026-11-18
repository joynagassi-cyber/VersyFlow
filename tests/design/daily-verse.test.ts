import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DAILY_VERSES,
  dailyVerseIndex,
  dayNumber,
  getDailyVerse,
  getUpcomingDailyVerses,
} from '@/domains/bible/daily-verse';
import {
  DAILY_VERSE_HOUR,
  DAILY_VERSE_WINDOW_DAYS,
  planDailyVerseNotifications,
} from '@/services/daily-verse-notifier';

const ROOT = resolve(__dirname, '../..');

describe('verset du jour — une source, hors ligne', () => {
  it('embarque un cycle assez long pour ne pas se répéter en un mois', () => {
    expect(DAILY_VERSES.length).toBeGreaterThanOrEqual(30);
  });

  it('n’a ni doublon de référence ni doublon de texte', () => {
    const refs = new Set(DAILY_VERSES.map((v) => v.reference));
    const ids = new Set(DAILY_VERSES.map((v) => v.id));
    expect(refs.size).toBe(DAILY_VERSES.length);
    expect(ids.size).toBe(DAILY_VERSES.length);
  });

  it('donne le même verset pour une même date, quel que soit l’instant', () => {
    const dawn = getDailyVerse(new Date(2026, 9, 30, 6, 12));
    const dusk = getDailyVerse(new Date(2026, 9, 30, 23, 58));
    expect(dusk.id).toBe(dawn.id);
  });

  it('change de verset chaque jour, sur une année entière', () => {
    let repeats = 0;
    let previous = getDailyVerse(new Date(2026, 0, 1)).id;
    const seen = new Set([previous]);
    for (let offset = 1; offset < 365; offset += 1) {
      const next = getDailyVerse(new Date(2026, 0, 1 + offset)).id;
      if (next === previous) repeats += 1;
      seen.add(next);
      previous = next;
    }
    expect(repeats).toBe(0);
    // Tout le cycle est visité : la liste entière tourne, aucun verset oublié.
    expect(seen.size).toBe(DAILY_VERSES.length);
  });

  it('reste défini avant l’époque du cycle (dates antérieures)', () => {
    const index = dailyVerseIndex(new Date(2025, 5, 15));
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(DAILY_VERSES.length);
    expect(dayNumber(new Date(2026, 0, 1))).toBe(0);
  });

  it('illustre chaque verset par une image locale existante', () => {
    const missing = DAILY_VERSES.filter((verse) => {
      const categoryOf = {
        ani: 'animaux', esprit: 'esprit', ev: 'evenements', frat: 'fraternite',
        lum: 'lumieres', nat: 'natures', obj: 'objets', sag: 'sagesse',
        sai: 'saisons', villes: 'villes',
      } as Record<string, string>;
      const category = categoryOf[verse.visual.split('-')[0]];
      if (!category) return true;
      return !['png', 'webp', 'jpg'].some((ext) =>
        existsSync(resolve(ROOT, `public/themes/${category}/${verse.visual}-landscape.${ext}`)),
      );
    });
    expect(missing.map((v) => `${v.id}:${v.visual}`)).toEqual([]);
  });

  it('varie les illustrations (pas un seul paysage recyclé)', () => {
    const visuals = new Set(DAILY_VERSES.map((v) => v.visual));
    expect(visuals.size).toBeGreaterThanOrEqual(30);
  });

  it('recopie fidèlement le texte LSG du dépôt', () => {
    const datasetPath = resolve(ROOT, 'data/bible/lsg.json');
    if (!existsSync(datasetPath)) return; // jeu de données non versionné ailleurs
    const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as {
      books: { id: string; chapters: { number: number; verses: { number: number; text: string }[] }[] }[];
    };
    const byBook = new Map(dataset.books.map((book) => [book.id, book]));

    const mismatches = DAILY_VERSES.flatMap((verse) => {
      const book = byBook.get(verse.book);
      const chapter = book?.chapters.find((c) => c.number === verse.chapter);
      const raw = chapter?.verses.find((v) => v.number === verse.verse)?.text;
      if (!raw) return [`${verse.id}: absent du jeu LSG`];
      // Le texte du module retire la suscription du psaume (« Cantique de
      // David. », « De David. »…). On la tolère : le verset doit être contenu
      // tel quel dans la source, à la ponctuation typographique près.
      const normalized = raw.replace(/^(Cantique de David|Cantique des degrés|De David|Psaume de David|Cantique|Psaume)\.\s*/, '').trim();
      return normalized === verse.text ? [] : [`${verse.id}: « ${verse.text.slice(0, 40)}… » ≠ LSG`];
    });

    expect(mismatches).toEqual([]);
  });
});

describe('notifications du verset du jour — planifiées sans réseau', () => {
  const from = new Date(2026, 9, 30, 7, 30);

  it('programme une notification par jour, à 8 h, sur 14 jours', () => {
    const plans = planDailyVerseNotifications(from);
    expect(plans).toHaveLength(DAILY_VERSE_WINDOW_DAYS);
    for (const plan of plans) {
      expect(plan.at.getHours()).toBe(DAILY_VERSE_HOUR);
      expect(plan.at.getMinutes()).toBe(0);
      expect(plan.at.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it('porte le texte du bon jour, pas un message générique', () => {
    const plans = planDailyVerseNotifications(from);
    const tomorrow = new Date(2026, 9, 31);
    expect(plans[1].verse.id).toBe(getDailyVerse(tomorrow).id);
    expect(plans[1].body).toContain(getDailyVerse(tomorrow).text);
    expect(plans[1].body).toContain(getDailyVerse(tomorrow).reference);
  });

  it('utilise des identifiants hors de la plage des rappels de révision (1–24)', () => {
    const ids = planDailyVerseNotifications(from).map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toBeGreaterThan(1000);
      expect(id).toBeLessThanOrEqual(1200);
    }
  });

  it('ne programme rien dans le passé (notification déjà passée aujourd’hui)', () => {
    const late = new Date(2026, 9, 30, 9, 0);
    const plans = planDailyVerseNotifications(late);
    expect(plans.every((plan) => plan.at.getTime() > late.getTime())).toBe(true);
    expect(plans[0].verse.id).toBe(getUpcomingDailyVerses(2, late)[1].id);
  });
});
