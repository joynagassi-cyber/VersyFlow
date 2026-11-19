import { isNativePlatform } from '@/lib/platform';
import { isMockMode } from '@/dev/mode';
import { getStorageIsolationState } from '@/dev/mock/storage-scope';

export interface ScheduledReminder {
  id: number;
  time: string;
  frequency: number;
}

export interface ReminderConfig {
  enabled: boolean;
  frequency: number;
  time: string;
}

const DEMO_DAILY_REMINDERS_KEY = 'versyflow:mock:daily-reminders';

function isIsolatedDemoRuntime(): boolean {
  if (isMockMode()) return true;
  const state = getStorageIsolationState();
  return state.installed && state.scopeActive;
}

let permissionGranted: boolean | null = null;
let permissionChecked = false;
let permissionRequestInFlight: Promise<void> | null = null;

export class NotificationService {
  async checkPermission(): Promise<boolean> {
    if (isMockMode()) return false;
    if (permissionChecked && permissionGranted !== null) return permissionGranted;
    if (!isNativePlatform() || isIsolatedDemoRuntime()) {
      permissionGranted = true;
      permissionChecked = true;
      return true;
    }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.checkPermissions();
      permissionGranted = result.display === 'granted';
      permissionChecked = result.display !== 'prompt';
      return permissionGranted;
    } catch {
      permissionGranted = false;
      permissionChecked = false;
      return false;
    }
  }

  async ensurePermissions(reminderEnabled: boolean): Promise<boolean> {
    if (isMockMode()) return reminderEnabled;
    if (!reminderEnabled) return false;
    if (permissionChecked && permissionGranted !== null) return permissionGranted;
    if (!isNativePlatform() || isIsolatedDemoRuntime()) return true;

    if (!permissionRequestInFlight) {
      permissionRequestInFlight = (async () => {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.requestPermissions();
          permissionGranted = await this.checkPermission();
          permissionChecked = true;
        } catch {
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

  async scheduleDailyReminders(reminders: ReminderConfig, body: string): Promise<ScheduledReminder[]> {
    const { enabled, time } = reminders;
    if (!enabled) {
      if (isIsolatedDemoRuntime()) {
        try { localStorage.removeItem(DEMO_DAILY_REMINDERS_KEY); } catch { /* ignore */ }
        return [];
      }
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

    if (isIsolatedDemoRuntime()) {
      try {
        localStorage.setItem(DEMO_DAILY_REMINDERS_KEY, JSON.stringify({ body, scheduled, updatedAt: Date.now() }));
      } catch { /* ignore */ }
      return scheduled;
    }

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
    }
    return scheduled;
  }

  async cancelAll(): Promise<void> {
    if (isIsolatedDemoRuntime()) {
      try { localStorage.removeItem(DEMO_DAILY_REMINDERS_KEY); } catch { /* ignore */ }
      permissionChecked = false;
      permissionGranted = null;
      return;
    }
    try {
      if (isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const pending = await LocalNotifications.getPending();
        const ours = pending.notifications.filter(({ id }) => id >= 1 && id <= 24);
        if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
      }
    } catch { /* no plugin — nothing to cancel */ }
    permissionChecked = false;
    permissionGranted = null;
  }

  private offsetTime(base: string, index: number, total: number): string {
    if (total <= 1) return base;
    const [h, m] = base.split(':').map(Number);
    const stepMinutes = Math.floor(1440 / total) * index;
    const totalMinutes = ((h * 60) + (m || 0) + stepMinutes) % 1440;
    const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const mm = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }
}

export const notificationService = new NotificationService();
