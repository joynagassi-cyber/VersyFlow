/**
 * Notifications Center Screen
 * Shows notification history and alert center
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from '@/hooks/useIonicNavigation';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { IonIcon } from '@/components/ui/Primitives'
import { alarm, bookmark, calendar, checkmark, notifications, arrowBack, notificationsOff } from 'ionicons/icons';
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
  if (min < 1) return t('notifications.justNow', "À l'instant");
  if (min < 60) return t('notifications.minAgo', { min, defaultValue: `Il y a ${min} min` });
  const h = Math.floor(min / 60);
  if (h < 24) return t('notifications.hoursAgo', { h, defaultValue: `Il y a ${h} h` });
  const d = Math.floor(h / 24);
  return t('notifications.daysAgo', { d, defaultValue: `Il y a ${d} jours` });
}

export default function NotificationsScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    color: colors.surface,
    fontWeight: '700',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.surface,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 24,
  },
  }), [colors]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const persistRead = (ids: string[]) => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable — read-state stays in memory
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      persistRead(next.filter(n => n.read).map(n => n.id));
      return next;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      persistRead(next.map(n => n.id));
      return next;
    });
  };

  // Real data: due reviews, streak, milestones — plus live eventBus events.
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
            id: `due-${new Date().toISOString().slice(0, 10)}`,
            type: 'reminder',
            title: t('notifications.dueTitle', { count: due, defaultValue: `${due} verset${due > 1 ? 's' : ''} à réviser` }),
            message: t('notifications.dueMessage', 'Des versets arrivent à échéance — démarrez une session de révision.'),
            time: t('notifications.today', "Aujourd'hui"),
            read: false,
            icon: 'time',
          });
        }
        if (streak > 1) {
          items.push({
            id: `streak-${streak}`,
            type: 'system',
            title: t('notifications.streakTitle', { count: streak, defaultValue: `${streak} jours de suite` }),
            message: t('notifications.streakMessage', 'Votre série de révisions continue. Ne la laissez pas s\'interrompre !'),
            time: t('notifications.today', "Aujourd'hui"),
            read: true,
            icon: 'flame',
          });
        }
        const milestones = await new MilestoneService(service, profileId).checkAndEmitMilestones();
        for (const m of milestones) {
          items.push({
            id: `milestone-${m.type}`,
            type: 'achievement',
            title: t('notifications.milestoneTitle', 'Jalon atteint'),
            message: t('notifications.milestoneMessage', { count: m.totalVerses, defaultValue: `${m.totalVerses} verset${m.totalVerses > 1 ? 's' : ''} mémorisé${m.totalVerses > 1 ? 's' : ''}` }),
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
          // No persisted read-state
        }
        setNotifications(items);
      } catch (e) {
        console.error('[Notifications] data load failed:', e);
      }
    };
    void load();

    const toLive = (type: Notification['type'], title: string, message: string) => {
      const item: Notification = {
        id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        title,
        message,
        time: t('notifications.justNow', "À l'instant"),
        read: false,
        icon: 'notifications',
      };
      setNotifications(prev => [item, ...prev].slice(0, 30));
    };
    const payloadOf = (ev: DomainEvent) => (ev?.payload ?? {}) as Record<string, unknown>;
    const onMemorized = (ev: DomainEvent) =>
      toLive('reminder', t('notifications.memorizedTitle', 'Verset mémorisé'), String(payloadOf(ev).reference ?? ''));
    const onReview = (ev: DomainEvent) =>
      toLive('system', t('notifications.reviewDoneTitle', 'Révision terminée'), String(payloadOf(ev).reference ?? ''));
    const onMilestone = () =>
      toLive('achievement', t('notifications.milestoneTitle', 'Jalon atteint'), t('notifications.milestoneLive', 'Nouveau jalon débloqué'));
    const onStreak = (ev: DomainEvent) =>
      toLive('system', t('notifications.streakLive', 'Série prolongée'), String(payloadOf(ev).streak ?? ''));
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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder': return 'notifications';
      case 'achievement': return 'trophy';
      case 'system': return 'settings';
      case 'social': return 'people';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'reminder': return 'colors.primary';
      case 'achievement': return 'colors.warning';
      case 'system': return 'colors.textMuted';
      case 'social': return 'colors.info';
      default: return 'colors.primary';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IonIcon icon={arrowBack} size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>{t('notifications.markAllRead', 'Tout lire')}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('notifications.allTab', 'Toutes')} ({notifications.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              {t('notifications.unreadTab', 'Non lues')} ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) + '20' }]}>
                <IonIcon icon={getNotificationIcon(notification.type) as any}
                  size={20}
                  color={getNotificationColor(notification.type)} />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <IonIcon icon={notificationsOff} size={64} color={colors.outline} />
            <Text style={styles.emptyTitle}>{t('notifications.empty', 'Aucune notification')}</Text>
            <Text style={styles.emptyMessage}>
              {filter === 'unread' ? t('notifications.emptyUnread', 'Vous avez tout lu !') : t('notifications.emptyAll', 'Vos notifications apparaîtront ici')}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
