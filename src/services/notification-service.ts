/**
 * Notification Service — local notification scheduler for reminder pushes.
 *
 * Uses Capacitor Local Notifications on native platforms and falls back to
 * in-app toasts on the Web so that reminders stay functional everywhere.
 */
// Fixed: Capacitor — notification permission request is now just-in-time (user-initiated), not fired at app launch

import { useAppearanceStore } from '@/store/appearance-store';
import i18next from 'i18next';

export interface ScheduledReminder {
  id: number;
  time: string; // HH:mm
  frequency: number; // times per day
}

const NOTIFICATION_CHANNEL = 'versyflow-reminders';

/** Cached permission state so we don't re-prompt / re-query on every call. */
let permissionGranted: boolean | null = null;
let permissionChecked = false;
let permissionRequestInFlight: Promise<void> | null = null;

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

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
   * it will NOT trigger the system prompt when the user hasn't enabled
   * reminders or when permission was already granted/denied.
   */
  async ensurePermissions(): Promise<boolean> {
    const { reminderEnabled } = useAppearanceStore.getState();
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
   * Schedule all pending daily reminders using the current appearance store.
   * Returns an array of reminder descriptions so the UI can show them.
   *
   * Safe to call at boot: when reminders are enabled but permissions were
   * never requested, it silently schedules (web fallback) and does NOT fire
   * the OS permission prompt — the prompt happens just-in-time via
   * `ensurePermissions()` from user-initiated handlers.
   */
  async scheduleDailyReminders(): Promise<ScheduledReminder[]> {
    const { reminderEnabled, reminderFrequency, reminderTime } =
      useAppearanceStore.getState();

    if (!reminderEnabled) return [];

    const reminders: ScheduledReminder[] = Array.from({ length: reminderFrequency }, (_, i) => ({
      id: i + 1,
      time: this.offsetTime(reminderTime, i, reminderFrequency),
      frequency: reminderFrequency,
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
          return reminders;
        }
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.createChannel({ id: NOTIFICATION_CHANNEL, name: 'VersyFlow' });
        for (const reminder of reminders) {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: reminder.id,
                title: 'VersyFlow',
                body: i18next.t('reminders.notificationBody', 'Temps de revision !'),
                channelId: NOTIFICATION_CHANNEL,
              },
            ],
          });
        }
        return reminders;
      }
    } catch {
      // Web / no plugin — fall back silently.
    }

    // Web fallback: no system notification, but we still return the schedule
    // so the UI can surface in-app reminder banners.
    return reminders;
  }

  /** Cancel all scheduled local reminders. */
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
