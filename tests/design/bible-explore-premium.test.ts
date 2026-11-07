import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatChapterCount } from '@/lib/chapter-count';

describe('Bible : explorer', () => {
  it('formate les chapitres pour zéro, un et deux sans exposer les marqueurs', () => {
    const fr = '{count} chapitre{plural}';
    expect([0, 1, 2].map((n) => formatChapterCount(fr, n, 'fr'))).toEqual(['0 chapitre', '1 chapitre', '2 chapitres']);
    const en = '{count} chapter{plural}';
    expect([0, 1, 2].map((n) => formatChapterCount(en, n, 'en'))).toEqual(['0 chapters', '1 chapter', '2 chapters']);
    expect(formatChapterCount('{count} 章{plural}', 2, 'zh-Hant')).toBe('2 章');
  });
  it('utilise les surfaces de premier niveau et conserve la recherche accessible', () => {
    const screen = readFileSync('app/(tabs)/explore.tsx', 'utf8');
    expect(screen).toContain('g1 tab-heading explore-heading');
    expect(screen).toContain('g2 explore-section');
    expect(screen).toContain('type="search"');
    expect(screen).toContain('aria-label={t(\'bible.search\'');
    expect(screen).toContain('navigate(`/bible/book/${book.id}`)');
  });
});
