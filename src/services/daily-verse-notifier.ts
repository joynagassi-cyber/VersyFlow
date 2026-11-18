/**
 * Notifications « verset du jour » — programmées localement, sans réseau.
 *
 * Le verset du jour est calculé par `@/domains/bible/daily-verse` (déterministe,
 * embarqué). Ce service ne fait qu'une chose : déposer les prochains jours dans
 * le planificateur du système, chacun avec **son** texte. Aucune requête, aucun
 * serveur de push : un appareil en mode avion reçoit quand même le verset, parce
 * que le texte et l'image sont déjà dans le bundle.
 *
 * Deux limites assumées, dites à l'écran plutôt que masquées :
 *  · natif (Android/iOS/Windows) → notifications système programmées, elles
 *    arrivent app fermée ;
 *  · web → pas de notification quand l'onglet est fermé (le navigateur ne
 *    réveille pas une PWA sans service worker ni push). Le verset reste dans
 *    l'app et dans le fil de notifications.
 */

import { isNativePlatform } from '@/lib/platform';
import { getUpcomingDailyVerses, type DailyVerse } from '@/domains/bible/daily-verse';

/** Heure locale d'envoi. Le verset du jour se lit le matin. */
export const DAILY_VERSE_HOUR = 8;

/** Fenêtre reprogrammée à chaque ouverture : 14 jours d'avance. */
export const DAILY_VERSE_WINDOW_DAYS = 14;

/**
 * Plage d'identifiants réservée à ces notifications (1001 → 1030). Les rappels
 * de révision utilisent 1 → 24 : aucune collision avec `NotificationService`.
 */
const ID_BASE = 1000;
const ID_MAX = 1200;

export interface DailyVerseNotification {
  id: number;
  /** Instant d'envoi (heure locale de l'appareil). */
  at: Date;
  title: string;
  body: string;
  verse: DailyVerse;
}

export type DailyVerseSyncReason =
  | 'scheduled'
  | 'web-unsupported'
  | 'permission-denied'
  | 'nothing-to-schedule';

export interface DailyVerseSyncResult {
  reason: DailyVerseSyncReason;
  scheduled: number;
}

/**
 * Plan pur : quelles notifications, quand, avec quel texte.
 *
 * `from` sert d'horloge (tests et reprogrammation) ; les jours déjà passés à
 * l'heure d'envoi sont ignorés — on ne programme pas une notification dans le
 * passé, le système la délivrerait immédiatement.
 */
export function planDailyVerseNotifications(
  from: Date = new Date(),
  days: number = DAILY_VERSE_WINDOW_DAYS,
  hour: number = DAILY_VERSE_HOUR,
): DailyVerseNotification[] {
  const verses = getUpcomingDailyVerses(days, from);
  const plans: DailyVerseNotification[] = [];
  verses.forEach((verse, offset) => {
    const at = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset, hour, 0, 0, 0);
    if (at.getTime() <= from.getTime()) return;
    plans.push({
      id: ID_BASE + plans.length + 1,
      at,
      title: 'Verset du jour',
      body: `${verse.reference} — ${verse.text}`,
      verse,
    });
  });
  return plans;
}

/**
 * Synchronise la fenêtre de notifications.
 *
 * `requestPermission: true` seulement depuis un geste utilisateur — jamais au
 * démarrage, où l'on se contente de reprogrammer si l'autorisation existe déjà.
 */
export async function syncDailyVerseNotifications(options: {
  requestPermission?: boolean;
  from?: Date;
  days?: number;
} = {}): Promise<DailyVerseSyncResult> {
  const from = options.from ?? new Date();
  const days = options.days ?? DAILY_VERSE_WINDOW_DAYS;
  const plans = planDailyVerseNotifications(from, days);

  if (!isNativePlatform()) {
    return { reason: 'web-unsupported', scheduled: 0 };
  }
  if (plans.length === 0) {
    return { reason: 'nothing-to-schedule', scheduled: 0 };
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    const permission = options.requestPermission
      ? await LocalNotifications.requestPermissions()
      : await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      return { reason: 'permission-denied', scheduled: 0 };
    }

    // Remplacer notre fenêtre, sans toucher aux rappels de révision (1–24).
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(({ id }) => id > ID_BASE && id <= ID_MAX);
    if (ours.length) {
      await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
    }

    await LocalNotifications.schedule({
      notifications: plans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        body: plan.body,
        schedule: { at: plan.at, allowWhileIdle: true },
        smallIcon: 'ic_stat_icon_config_sample',
      })),
    });

    return { reason: 'scheduled', scheduled: plans.length };
  } catch {
    // Plugin absent (web build servie en navigateur) ou refus système : on ne
    // casse pas le démarrage, l'appelant décide quoi afficher.
    return { reason: 'permission-denied', scheduled: 0 };
  }
}

/** Retire les notifications de verset du jour (désactivation explicite). */
export async function cancelDailyVerseNotifications(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter(({ id }) => id > ID_BASE && id <= ID_MAX);
    if (ours.length) {
      await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
    }
  } catch {
    /* pas de plugin : rien à annuler */
  }
}
