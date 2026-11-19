import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyWeeklyPlan, DEFAULT_WEEKLY_PLAN, normalizeWeeklyPlan, WEEKLY_PLAN_KEY } from '@/services/weekly-reminder-plan';
import { NotificationService } from '@/services/notification-service';

const mocks = vi.hoisted(() => ({
  native: false,
  mock: false,
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  getPending: vi.fn(async () => ({ notifications: [{ id: 1 }, { id: 101 }, { id: 108 }, { id: 113 }, { id: 999 }] })),
  cancel: vi.fn(async () => undefined),
  schedule: vi.fn(async () => ({ notifications: [] })),
}));
vi.mock('@/dev/mode', () => ({ isMockMode: () => mocks.mock }));
vi.mock('@/lib/platform', () => ({ isNativePlatform: () => mocks.native }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: mocks }));

beforeEach(() => { mocks.native = false; mocks.mock = false; vi.clearAllMocks(); localStorage.clear(); });
const bodies = { review: 'review', memorization: 'memorization' };

describe('planning hebdomadaire', () => {
  it('normalise les jours et conserve des valeurs sûres', () => {
    expect(normalizeWeeklyPlan({ review: { enabled: true, time: '25:60', days: [2, 2, 99, 7] } }).review).toEqual({ enabled: true, time: '09:00', days: [2, 7] });
  });
  it('sur le Web, enregistre sans prétendre programmer des notifications', async () => {
    expect(await applyWeeklyPlan(DEFAULT_WEEKLY_PLAN, bodies)).toBe('web');
    expect(localStorage.getItem(WEEKLY_PLAN_KEY)).toBeTruthy();
    expect(mocks.schedule).not.toHaveBeenCalled();
  });
  it('sur appareil, remplace seulement les IDs hebdomadaires et utilise les horaires choisis', async () => {
    mocks.native = true;
    const plan = { review: { enabled: true, time: '09:30', days: [2, 7] as (2 | 7)[] }, memorization: { enabled: true, time: '20:15', days: [1] as 1[] } };
    expect(await applyWeeklyPlan(plan, bodies)).toBe('native');
    expect(mocks.cancel).toHaveBeenCalledWith({ notifications: [{ id: 101 }, { id: 113 }] });
    expect(mocks.schedule).toHaveBeenCalledWith({ notifications: [
      { id: 102, title: 'VersyFlow', body: 'review', schedule: { on: { weekday: 2, hour: 9, minute: 30 }, repeats: true } },
      { id: 107, title: 'VersyFlow', body: 'review', schedule: { on: { weekday: 7, hour: 9, minute: 30 }, repeats: true } },
      { id: 111, title: 'VersyFlow', body: 'memorization', schedule: { on: { weekday: 1, hour: 20, minute: 15 }, repeats: true } },
    ] });
  });
  it('un refus de permission ne sauvegarde pas un faux succès', async () => {
    mocks.native = true;
    mocks.requestPermissions.mockResolvedValueOnce({ display: 'denied' });
    await expect(applyWeeklyPlan({ ...DEFAULT_WEEKLY_PLAN, review: { enabled: true, time: '09:00', days: [2] } }, bodies)).rejects.toThrow('permission-denied');
    expect(mocks.schedule).not.toHaveBeenCalled();
    expect(localStorage.getItem(WEEKLY_PLAN_KEY)).toBeNull();
  });
  it('en démo native, ne consulte ni ne modifie les notifications de l’appareil', async () => {
    mocks.native = true;
    mocks.mock = true;
    const plan = { ...DEFAULT_WEEKLY_PLAN, review: { enabled: true, time: '09:30', days: [2] as 2[] } };
    expect(await applyWeeklyPlan(plan, bodies)).toBe('demo');
    expect(JSON.parse(localStorage.getItem(WEEKLY_PLAN_KEY)!)).toEqual(plan);
    const service = new NotificationService();
    expect(await service.checkPermission()).toBe(false);
    expect(await service.ensurePermissions(true)).toBe(true);
    expect(await service.scheduleDailyReminders({ enabled: true, frequency: 1, time: '08:00' }, 'demo')).toHaveLength(1);
    await service.scheduleDailyReminders({ enabled: false, frequency: 1, time: '08:00' }, 'demo');
    await service.cancelAll();
    expect(mocks.requestPermissions).not.toHaveBeenCalled();
    expect(mocks.checkPermissions).not.toHaveBeenCalled();
    expect(mocks.getPending).not.toHaveBeenCalled();
    expect(mocks.cancel).not.toHaveBeenCalled();
    expect(mocks.schedule).not.toHaveBeenCalled();
  });
  it('un état prompt au démarrage autorise ensuite une demande explicite', async () => {
    mocks.native = true;
    const service = new NotificationService();
    await service.cancelAll();
    mocks.checkPermissions.mockResolvedValueOnce({ display: 'prompt' }).mockResolvedValueOnce({ display: 'granted' });
    expect(await service.checkPermission()).toBe(false);
    expect(await service.ensurePermissions(true)).toBe(true);
    expect(mocks.requestPermissions).toHaveBeenCalled();
    await service.cancelAll();
  });
  it('les anciens rappels quotidiens restent récurrents sans supprimer les rappels hebdomadaires', async () => {
    mocks.native = true;
    const service = new NotificationService();
    await service.cancelAll();
    await service.scheduleDailyReminders({ enabled: true, frequency: 2, time: '08:00' }, 'daily');
    expect(mocks.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }] });
    expect(mocks.schedule).toHaveBeenCalledWith({ notifications: [
      { id: 1, title: 'VersyFlow', body: 'daily', schedule: { on: { hour: 8, minute: 0 }, repeats: true } },
      { id: 2, title: 'VersyFlow', body: 'daily', schedule: { on: { hour: 20, minute: 0 }, repeats: true } },
    ] });
  });
});
