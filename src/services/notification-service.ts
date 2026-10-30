/**
 * Notification Service — local notification scheduler for reminder pushes.
 *
 * Uses Capacitor Local Notifications on native platforms and falls back to
 * in-app toasts on the Web so that reminders stay functional everywhere.
 *
 * Fixed: dependency injection — this service no longer reads the appearance
 * store nor i18next. Callers (reminders screen, about screen, app boot) read
 * their own stores and translate the notification body themselves, then pass
 * the concrete values as arguments. This keeps the service pure and
 * testable, and avoids stale-cache races around reminder state changes.
 */
// Fixed: Capacitor — notification permission request is now just-in-time (user-initiated), not fired at app launch

import { isNativePlatform } from '@/lib/platform';

export interface ScheduledReminder {
  id: number;
  time: string; // HH:mm
  frequency: number; // times per day
}

export interface ReminderConfig {
  enabled: boolean;
  frequency: number;
  time: string;
}


/**
 * Cached permission state so we don't re-prompt / re-query on every call.
 * The cache is invalidated on `cancelAll()` so that a reminder state
 * change (on/off, reschedule) forces a fresh permission re-check on the
 * next `ensurePermissions()` call — this guards against the off/on race
 * where a stale `granted`/`denied` result could survive a cycle.
 */
let permissionGranted: boolean | null = null;
let permissionChecked = false;
let permissionRequestInFlight: Promise<void> | null = null;

export class NotificationService {
  /**
   * Check the current notification permission state without prompting.
   * Caches the result of `LocalNotifications.checkPermissions()` in module
   * state so subsequent calls are cheap.
   */
  async checkPermission(): Promise<boolean> {
    if (permissionChecked && permissionGranted !== null) {
      return permissionGranted;
    }
    if (!isNativePlatform()) {
      // Web has no system permission concept — treat as granted so the
      // in-app fallback path keeps working.
      permissionGranted = true;
      permissionChecked = true;
      return true;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.checkPermissions();
      // `display` is the only permission state this plugin exposes:
      // 'granted' | 'prompt' | 'denied' | 'disabled'.
      permissionGranted = result.display === 'granted';
      // Un état « prompt » obtenu au démarrage ne doit pas empêcher la
      // demande de permission déclenchée plus tard par l'utilisateur.
      permissionChecked = result.display !== 'prompt';
      return permissionGranted;
    } catch {
      // An unavailable native plugin cannot schedule notifications.
      permissionGranted = false;
      permissionChecked = false;
      return false;
    }
  }

  /**
   * Request notification permission just-in-time (user-initiated).
   * Safe to call from user actions such as "Planifier les rappels" —
   * it will NOT trigger the system prompt when reminders are disabled
   * (caller passes `reminderEnabled = false`) or when permission was
   * already granted/denied.
   *
   * The reminder-enabled state is passed in by the caller rather than read
   * from the appearance store, keeping this service store-free.
   */
  async ensurePermissions(reminderEnabled: boolean): Promise<boolean> {
    if (!reminderEnabled) {
      // Reminders are off — no reason to prompt the OS.
      return false;
    }
    if (permissionChecked && permissionGranted !== null) {
      return permissionGranted;
    }
    if (!isNativePlatform()) return true;
    // De-duplicate concurrent calls so a rapid double-tap doesn't stack
    // two OS permission dialogs.
    if (!permissionRequestInFlight) {
      permissionRequestInFlight = (async () => {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.requestPermissions();
          permissionGranted = await this.checkPermission();
          permissionChecked = true;
        } catch {
          // A native plugin failure is not a successful permission request.
          permissionGranted = false;
          permissionChecked = true;
        } finally {
          permissionRequestInFlight = null;
        }
      })();
    }
    await permissionRequestInFlight;
    return permissionGranted ?? true;
  }

  /**
   * Schedule all pending daily reminders.
   *
   * The caller passes the current reminder configuration and the (already
   * translated) notification body — the service never reads the store or
   * i18next itself.
   *
   * Returns an array of reminder descriptions so the UI can show them.
   *
   * Safe to call at boot: when reminders are enabled but permissions were
   * never requested, it silently schedules (web fallback) and does NOT fire
   * the OS permission prompt — the prompt happens just-in-time via
   * `ensurePermissions()` from user-initiated handlers.
   */
  async scheduleDailyReminders(
    reminders: ReminderConfig,
    body: string,
  ): Promise<ScheduledReminder[]> {
    const { enabled, time } = reminders;
    if (!enabled) {
      if (isNativePlatform()) await this.cancelAll();
      return [];
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('invalid-time');
    const frequency = Math.max(1, Math.min(24, Math.floor(reminders.frequency) || 1));

    const scheduled: ScheduledReminder[] = Array.from({ length: frequency }, (_, i) => ({
      id: i + 1,
      time: this.offsetTime(time, i, frequency),
      frequency,
    }));

    // Les notifications natives doivent avoir un horaire récurrent explicite ;
    // sinon le plugin les délivre immédiatement. Remplacer seulement nos IDs.
    if (isNativePlatform()) {
      if (!await this.checkPermission()) throw new Error('permission-denied');
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      const ours = pending.notifications.filter(({ id }) => id >= 1 && id <= 24);
      if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
      await LocalNotifications.schedule({
        notifications: scheduled.map((reminder) => {
          const [hour, minute] = reminder.time.split(':').map(Number);
          return { id: reminder.id, title: 'VersyFlow', body, schedule: { on: { hour, minute }, repeats: true } };
        }),
      });
      return scheduled;
    }

    // Web fallback: no system notification, but we still return the schedule
    // so the UI can surface in-app reminder banners.
    return scheduled;
  }

  /**
   * Cancel the legacy daily reminders (IDs 1–24), leaving weekly and other
   * notifications alone, and invalidate the cached permission state.
   *
   * Resetting the cache here is deliberate: a reminder off/on cycle can
   * otherwise leave a stale `granted`/`denied` result in place, and the
   * next `ensurePermissions()` call would trust it without re-checking.
   */
  async cancelAll(): Promise<void> {
    try {
      if (isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        const ours = pending.notifications.filter(({ id }) => id >= 1 && id <= 24);
        if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
      }
    } catch {
      /* no plugin — nothing to cancel */
    }
    // Reset the cached permission state so a later user-initiated request
    // re-queries the OS.
    permissionChecked = false;
    permissionGranted = null;
  }

  /**
   * Compute a time offset from the base reminder time so multiple
   * same-day reminders don't stack at the same minute.
   */
  private offsetTime(base: string, index: number, total: number): string {
    if (total <= 1) return base;
    const [h, m] = base.split(':').map(Number);
    const stepMinutes = Math.floor(1440 / total) * index;
    const totalMinutes = ((h * 60 + (m || 0)) + stepMinutes) % 1440;
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mm = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

export const notificationService = new NotificationService();
