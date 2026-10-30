import { isNativePlatform } from '@/lib/platform';
import { getStorageIsolationState } from '@/dev/mock/storage-scope';
import type { Weekday } from '@capacitor/local-notifications';

/** Sunday=1 through Saturday=7, the convention used by Capacitor. */
export type ReminderDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type WeeklyReminderKind = 'review' | 'memorization';
export interface WeeklyReminder { enabled: boolean; time: string; days: ReminderDay[] }
export type WeeklyReminderPlan = Record<WeeklyReminderKind, WeeklyReminder>;
export const WEEKLY_PLAN_KEY = 'versyflow:weekly-reminder-plan';
export const DEFAULT_WEEKLY_PLAN: WeeklyReminderPlan = {
  review: { enabled: false, time: '09:00', days: [2, 3, 4, 5, 6] },
  memorization: { enabled: false, time: '19:00', days: [2, 3, 4, 5, 6] },
};

function validTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function normalizeWeeklyPlan(input: unknown): WeeklyReminderPlan {
  const object = input && typeof input === 'object' ? input as Partial<Record<WeeklyReminderKind, Partial<WeeklyReminder>>> : {};
  const clean = (kind: WeeklyReminderKind): WeeklyReminder => {
    const item = object[kind];
    const fallback = DEFAULT_WEEKLY_PLAN[kind];
    const days = Array.isArray(item?.days) ? Array.from(new Set(item.days.filter((day): day is ReminderDay => Number.isInteger(day) && day >= 1 && day <= 7))) : [...fallback.days];
    return { enabled: item?.enabled === true, time: validTime(item?.time) ? item.time : fallback.time, days };
  };
  return { review: clean('review'), memorization: clean('memorization') };
}
export function loadWeeklyPlan(): WeeklyReminderPlan {
  try { return normalizeWeeklyPlan(JSON.parse(localStorage.getItem(WEEKLY_PLAN_KEY) ?? 'null')); }
  catch { return normalizeWeeklyPlan(null); }
}

/** The web view has no background scheduler. Persist the plan, but never
 * claim notifications were scheduled there. On native, only our own IDs are
 * replaced; other app notifications and the legacy daily reminders survive. */
export async function applyWeeklyPlan(plan: WeeklyReminderPlan, bodies: Record<WeeklyReminderKind, string>): Promise<'native' | 'web'> {
  const normalized = normalizeWeeklyPlan(plan);
  const isolation = getStorageIsolationState();
  if (!isNativePlatform() || (isolation.installed && isolation.scopeActive)) {
    localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(normalized));
    return 'web';
  }
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const hasEnabledDays = (['review', 'memorization'] as const).some((kind) => normalized[kind].enabled && normalized[kind].days.length > 0);
  if (hasEnabledDays) {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') throw new Error('permission-denied');
  }
  const pending = await LocalNotifications.getPending();
  const ours = pending.notifications.filter((notification) => (notification.id >= 101 && notification.id <= 107) || (notification.id >= 111 && notification.id <= 117));
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
  const notifications = (['review', 'memorization'] as const).flatMap((kind, kindIndex) => {
    const item = normalized[kind];
    if (!item.enabled) return [];
    const [hour, minute] = item.time.split(':').map(Number);
    return item.days.map((day) => ({
      id: 100 + kindIndex * 10 + day,
      title: 'VersyFlow', body: bodies[kind],
      schedule: { on: { weekday: day as Weekday, hour, minute }, repeats: true },
    }));
  });
  if (notifications.length) await LocalNotifications.schedule({ notifications });
  localStorage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(normalized));
  return 'native';
}
