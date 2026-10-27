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

const NOTIFICATION_CHANNEL = 'versyflow-reminders';

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
      permissionChecked = true;
      return permissionGranted;
    } catch {
      // Plugin unavailable — treat as granted so scheduling proceeds (no-op).
      permissionGranted = true;
      permissionChecked = true;
      return true;
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
          // Web / no plugin — proceed with the in-app fallback.
          permissionGranted = true;
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
    const { enabled, frequency, time } = reminders;

    if (!enabled) return [];

    const scheduled: ScheduledReminder[] = Array.from({ length: frequency }, (_, i) => ({
      id: i + 1,
      time: this.offsetTime(time, i, frequency),
      frequency,
    }));

    // On native Capacitor, schedule via the plugin. Permission is requested
    // just-in-time by the UI (`ensurePermissions`); here we only check and
    // silently fall back to the web path when it hasn't been granted yet.
    try {
      if (isNativePlatform()) {
        const granted = await this.checkPermission();
        if (!granted) {
          // Permission not granted yet — do NOT prompt here (that happens on
          // user action). The in-app fallback still returns the schedule so
          // the UI can surface reminder banners.
          return scheduled;
        }
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.createChannel({ id: NOTIFICATION_CHANNEL, name: 'VersyFlow' });
        for (const reminder of scheduled) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: reminder.id,
                title: 'VersyFlow',
                body,
                channelId: NOTIFICATION_CHANNEL,
              },
            ],
          });
        }
        return scheduled;
      }
    } catch {
      // Web / no plugin — fall back silently.
    }

    // Web fallback: no system notification, but we still return the schedule
    // so the UI can surface in-app reminder banners.
    return scheduled;
  }

  /**
   * Cancel all scheduled local reminders and reset the cached permission
   * state so a later user-initiated request re-queries the OS.
   *
   * Resetting the cache here is deliberate: a reminder off/on cycle can
   * otherwise leave a stale `granted`/`denied` result in place, and the
   * next `ensurePermissions()` call would trust it without re-checking.
   */
  async cancelAll(): Promise<void> {
    try {
      if (isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancelAll();
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
    const stepMinutes = Math.floor(1440 / total) * (index + 1);
    const totalMinutes = ((h * 60 + (m || 0)) + stepMinutes) % 1440;
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mm = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

export const notificationService = new NotificationService();
