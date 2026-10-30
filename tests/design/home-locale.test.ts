import { describe, it, expect } from 'vitest';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import { readFileSync } from 'node:fs';

describe('démarrage de l’accueil', () => {
  it('normalise une locale système non valide avant le formatage des dates', () => {
    const locale = normalizeLocaleCode('en-US@posix');
    expect(locale).toBe('en');
    expect(() => new Date().toLocaleDateString(locale)).not.toThrow();
    const home = readFileSync('app/(tabs)/index.tsx', 'utf8');
    expect(home).toContain('normalizeLocaleCode(i18n.resolvedLanguage || i18n.language)');
    expect(home).not.toContain('toLocaleDateString(i18n.language');
  });
  it('propose un message et une action si le module de démarrage reste bloqué', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('showBootFailure');
    expect(html).toContain('Réessayer');
    expect(html).toContain('20000');
  });
});
