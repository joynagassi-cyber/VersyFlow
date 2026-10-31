/**
 * « Demain », « dans 3 jours », « il y a 2 jours » — dans 45 langues.
 *
 * Deux écrans écrivaient ces libellés en ternaire `fr`/`en` : les 43 autres
 * langues de la plateforme basculaient en anglais, et le compte se faisait en
 * tranches de 24 h (`Math.ceil`), donc une révision due demain à 00 h 30
 * s'affichait « aujourd'hui ». Ces tests fixent les deux corrections.
 */
import { describe, expect, it } from 'vitest';
import { calendarDayOffset, relativeDayLabel } from '@/lib/relative-day';

/** Un instant local précis, pour ne dépendre d'aucun fuseau. */
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('relativeDayLabel', () => {
  const now = at(2026, 10, 30, 9);

  it('emploie les formes irrégulières du français', () => {
    // Apostrophe typographique (U+2019) fournie par Intl — la même que le
    // reste des libellés français de l'application.
    expect(relativeDayLabel(at(2026, 10, 30), 'fr', now)).toBe('aujourd’hui');
    expect(relativeDayLabel(at(2026, 10, 31), 'fr', now)).toBe('demain');
    expect(relativeDayLabel(at(2026, 10, 29), 'fr', now)).toBe('hier');
    expect(relativeDayLabel(at(2026, 11, 2), 'fr', now)).toBe('dans 3 jours');
  });

  it('emploie celles de l’anglais', () => {
    expect(relativeDayLabel(at(2026, 10, 30), 'en', now)).toBe('today');
    expect(relativeDayLabel(at(2026, 10, 31), 'en', now)).toBe('tomorrow');
    expect(relativeDayLabel(at(2026, 11, 2), 'en', now)).toBe('in 3 days');
  });

  it('parle les 43 autres langues, sans repli anglais', () => {
    for (const locale of ['es', 'de', 'pt-BR', 'ar', 'zh-Hant', 'ko', 'sw']) {
      const label = relativeDayLabel(at(2026, 10, 31), locale, now);
      expect(label.toLowerCase()).not.toBe('tomorrow');
      expect(label.length).toBeGreaterThan(0);
    }
    expect(relativeDayLabel(at(2026, 10, 31), 'es', now)).toBe('mañana');
  });

  it('compte en jours de CALENDRIER, pas en tranches de 24 h', () => {
    // 00 h 30 demain : moins de 24 h, et pourtant bien « demain ».
    const lateTomorrow = at(2026, 10, 31, 0);
    const lateTonight = at(2026, 10, 30, 23);
    expect(calendarDayOffset(lateTomorrow, lateTonight)).toBe(1);
    expect(relativeDayLabel(lateTomorrow, 'fr', lateTonight)).toBe('demain');
    // Et l'inverse, la veille à 23 h 30 : « hier », pas « aujourd'hui ».
    expect(relativeDayLabel(at(2026, 10, 29, 23), 'fr', at(2026, 10, 30, 0))).toBe('hier');
  });

  it('reste stable sur une langue inconnue de l’environnement', () => {
    expect(() => relativeDayLabel(at(2026, 11, 2), 'xx-unknown', now)).not.toThrow();
  });
});
