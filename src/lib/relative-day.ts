import { normalizeLocaleCode } from '@/domains/i18n/config';

const DAY_MS = 86_400_000;

/** Minuit local d'un instant : la seule base correcte pour compter des jours. */
function startOfLocalDay(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * « Aujourd'hui », « demain », « dans 3 jours », « il y a 2 jours » — dans la
 * langue de l'utilisateur, pas dans celle du développeur.
 *
 * Deux écrans écrivaient `i18n.language === 'fr' ? 'Demain' : 'Tomorrow'` :
 * l'application annonce 45 langues, ces libellés n'en couvraient que deux et
 * basculaient en anglais pour les 43 autres. `Intl.RelativeTimeFormat` fait le
 * travail pour toutes les langues de la plateforme, avec les formes
 * irrégulières (« hier », « aujourd'hui », « 前天 »…).
 *
 * Le compte se fait en JOURS DE CALENDRIER locaux, pas en tranches de 24 h :
 * une révision due demain à 00 h 30 est « demain », même si elle est à moins
 * de 24 heures (l'ancien `Math.ceil` l'annonçait « aujourd'hui »).
 */
export function relativeDayLabel(
  target: number,
  language: string,
  now: number = Date.now(),
): string {
  const locale = normalizeLocaleCode(language);
  const diffDays = Math.round(
    (startOfLocalDay(target) - startOfLocalDay(now)) / DAY_MS,
  );
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
      diffDays,
      'day',
    );
  } catch {
    // Environnement sans données Intl pour cette langue : repli neutre, jamais
    // une phrase à moitié traduite.
    const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return format.format(diffDays, 'day');
  }
}

/** Nombre de jours de calendrier entre deux instants (négatif = passé). */
export function calendarDayOffset(target: number, now: number = Date.now()): number {
  return Math.round((startOfLocalDay(target) - startOfLocalDay(now)) / DAY_MS);
}
