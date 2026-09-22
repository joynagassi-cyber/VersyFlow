import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  Bell,
  Trophy,
  Settings2,
  Users,
  BellOff,
  Check,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { StreakService } from '@/services/streak-service';
import { ReviewQueueService } from '@/services/review-queue-service';
import { MilestoneService } from '@/services/milestone-service';
import { eventBus, DomainEventTypes, type DomainEvent } from '@/domains/events';

interface Notification {
  id: string;
  type: 'reminder' | 'achievement' | 'system' | 'social';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

const READ_KEY = 'versyflow:notifications:read';

function relativeTime(ts: number, t: TFunction): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('notifications.justNow', "A l'instant");
  if (min < 60) return t('notifications.minAgo', { min, defaultValue: "Il y a " + min + " min" });
  const h = Math.floor(min / 60);
  if (h < 24) return t('notifications.hoursAgo', { h, defaultValue: "Il y a " + h + " h" });
  const d = Math.floor(h / 24);
  return t('notifications.daysAgo', { d, defaultValue: "Il y a " + d + " jours" });
}

function notifIcon(type: Notification['type']) {
  switch (type) {
    case 'reminder':
      return Bell;
    case 'achievement':
      return Trophy;
    case 'system':
      return Settings2;
    case 'social':
      return Users;
    default:
      return Bell;
  }
}
function notifColor(type: Notification['type']) {
  switch (type) {
    case 'reminder':
      return 'var(--color-primary)';
    case 'achievement':
      return 'var(--color-warning)';
    case 'system':
      return 'var(--color-text-muted)';
    case 'social':
      return 'var(--color-info)';
    default:
      return 'var(--color-primary)';
  }
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const persistRead = (ids: string[]) => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      /* in-memory only */
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistRead(next.filter((n) => n.read).map((n) => n.id));
      return next;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      persistRead(next.map((n) => n.id));
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const items: Notification[] = [];
        const [streak, summary] = await Promise.all([
          new StreakService(service, profileId).calculateStreak(),
          new ReviewQueueService(service, getFsrsEngine(), profileId).getQueueSummary(),
        ]);
        const due = summary.dueToday + summary.delayed;
        if (due > 0) {
          items.push({
            id: 'due-' + new Date().toISOString().slice(0, 10),
            type: 'reminder',
            title: t('notifications.dueTitle', { count: due, defaultValue: due + " verset" + (due > 1 ? 's' : '') + " a reviser" }),
            message: t('notifications.dueMessage', 'Des versets arrivent a echeance - demarrez une session.'),
            time: t('notifications.today', "Aujourd'hui"),
            read: false,
            icon: 'time',
          });
        }
        if (streak > 1) {
          items.push({
            id: 'streak-' + streak,
            type: 'system',
            title: t('notifications.streakTitle', { count: streak, defaultValue: streak + ' jours de suite' }),
            message: t('notifications.streakMessage', 'Votre serie continue. Ne la laissez pas s\'interrompre !'),
            time: t('notifications.today', "Aujourd'hui"),
            read: true,
            icon: 'flame',
          });
        }
        const milestones = await new MilestoneService(service, profileId).checkAndEmitMilestones();
        for (const m of milestones) {
          items.push({
            id: 'milestone-' + m.type,
            type: 'achievement',
            title: t('notifications.milestoneTitle', 'Jalon atteint'),
            message: t('notifications.milestoneMessage', { count: m.totalVerses, defaultValue: m.totalVerses + ' verset(s) memorise(s)' }),
            time: relativeTime(m.reachedAt, t),
            read: true,
            icon: 'trophy',
          });
        }
        if (cancelled) return;
        try {
          const raw = localStorage.getItem(READ_KEY);
          const readIds: string[] = raw ? (JSON.parse(raw) as string[]) : [];
          for (const n of items) n.read = n.read || readIds.includes(n.id);
        } catch {
          /* none */
        }
        setNotifications(items);
      } catch (e) {
        console.error('[Notifications] data load failed:', e);
      }
    };
    void load();

    const toLive = (type: Notification['type'], title: string, message: string) => {
      const item: Notification = {
        id: 'live-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        type,
        title,
        message,
        time: t('notifications.justNow', "A l'instant"),
        read: false,
        icon: 'notifications',
      };
      setNotifications((prev) => [item, ...prev].slice(0, 30));
    };
    const payloadOf = (ev: DomainEvent): Record<string, unknown> => ev.payload;
    const onMemorized = (ev: DomainEvent) =>
      toLive('reminder', t('notifications.memorizedTitle', 'Verset memorise'), String(payloadOf(ev).reference ?? ''));
    const onReview = (ev: DomainEvent) =>
      toLive('system', t('notifications.reviewDoneTitle', 'Revision terminee'), String(payloadOf(ev).reference ?? ''));
    const onMilestone = () =>
      toLive('achievement', t('notifications.milestoneTitle', 'Jalon atteint'), t('notifications.milestoneLive', 'Nouveau jalon debloque'));
    const onStreak = (ev: DomainEvent) =>
      toLive('system', t('notifications.streakLive', 'Serie prolongee'), String(payloadOf(ev).streak ?? ''));
    eventBus.on(DomainEventTypes.VERSE_MEMORIZED, onMemorized);
    eventBus.on(DomainEventTypes.REVIEW_COMPLETED, onReview);
    eventBus.on(DomainEventTypes.PROGRESS_MILESTONE_REACHED, onMilestone);
    eventBus.on(DomainEventTypes.STREAK_INCREMENTED, onStreak);

    return () => {
      cancelled = true;
      eventBus.off(DomainEventTypes.VERSE_MEMORIZED, onMemorized);
      eventBus.off(DomainEventTypes.REVIEW_COMPLETED, onReview);
      eventBus.off(DomainEventTypes.PROGRESS_MILESTONE_REACHED, onMilestone);
      eventBus.off(DomainEventTypes.STREAK_INCREMENTED, onStreak);
    };
  }, [profileId, t]);

  return (
    <FullScreenPage
      title={t('nav.notifications', 'Notifications')}
      showBack
      right={
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <Check size={14} />
          {t('notifications.markAllRead', 'Tout lire')}
        </button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        {unreadCount > 0 && (
          <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
            {unreadCount} {t('notifications.unread', 'non lues')}
          </span>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={
              'flex-1 rounded-full py-2 text-sm font-medium ' +
              (filter === 'all' ? 'bg-primary text-white' : 'bg-surface-tint text-text-secondary')
            }
          >
            {t('notifications.allTab', 'Toutes')} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={
              'flex-1 rounded-full py-2 text-sm font-medium ' +
              (filter === 'unread' ? 'bg-primary text-white' : 'bg-surface-tint text-text-secondary')
            }
          >
            {t('notifications.unreadTab', 'Non lues')} ({unreadCount})
          </button>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((n) => {
              const Icon = notifIcon(n.type);
              const color = notifColor(n.type);
              return (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={
                    'flex w-full items-start gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm ' +
                    (n.read ? '' : 'ring-1 ring-[color:var(--color-divider)]')
                  }
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ color, backgroundColor: color.replace(')', '') + '20' }}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={
                          'text-sm ' +
                          (n.read
                            ? 'font-medium text-text-primary'
                            : 'font-bold text-text-primary')
                        }
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">{n.time}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm text-text-secondary">
                      {n.message}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8">
            <EmptyState
              title={t('notifications.empty', 'Aucune notification')}
              description={
                filter === 'unread'
                  ? t('notifications.emptyUnread', 'Vous avez tout lu !')
                  : t('notifications.emptyAll', 'Vos notifications apparaitront ici')
              }
              icon={<BellOff size={40} className="text-text-muted" />}
              showLogo={false}
            />
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}
