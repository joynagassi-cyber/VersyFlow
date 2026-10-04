import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Flame,
  Medal,
  RefreshCw,
  Trophy,
  Star,
  Lock,
  Check,
  CheckCircle2,
  BookMarked,
  FolderOpen,
  Globe,
  School,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { getMemorizationService } from '@/services/memorization-service-factory';
import { getFsrsEngine } from '@/services/fsrs-factory';
import { ProgressService } from '@/services/progress-service';
import { colorTintAlpha, colorTintSurface } from '@/lib/platform';

type Cat = 'memorization' | 'review' | 'streak' | 'collection' | 'special';
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  requirement: string;
  category: Cat;
}

const ICON_MAP: Record<string, typeof Star> = {
  book: BookOpen,
  bookmarks: BookMarked,
  school: School,
  trophy: Trophy,
  flame: Flame,
  fire: Flame,
  star: Star,
  refresh: RefreshCw,
  'checkmark-done': CheckCircle2,
  folder: FolderOpen,
  folders: FolderOpen,
  medal: Medal,
  globe: Globe,
};

// Achievement accent colors map to semantic design tokens (defined in
// src/styles/globals.css) so achievements adapt to light/dark themes.
const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_verse', title: 'Premier pas', description: "Memorisez votre premier verset", icon: 'book', color: 'var(--color-primary)', unlocked: false, progress: 0, requirement: '1 verset', category: 'memorization' },
  { id: 'ten_verses', title: 'Collectionneur', description: 'Memorisez 10 versets', icon: 'bookmarks', color: 'var(--color-info)', unlocked: false, progress: 0, requirement: '10 versets', category: 'memorization' },
  { id: 'fifty_verses', title: 'Erudit', description: 'Memorisez 50 versets', icon: 'school', color: 'var(--color-warning)', unlocked: false, progress: 0, requirement: '50 versets', category: 'memorization' },
  { id: 'hundred_verses', title: "Maitre bibliste", description: 'Memorisez 100 versets', icon: 'trophy', color: 'var(--color-success)', unlocked: false, progress: 0, requirement: '100 versets', category: 'memorization' },
  { id: 'streak_7', title: 'Hebdomadaire', description: '7 jours de suite', icon: 'flame', color: 'var(--color-accent)', unlocked: false, progress: 0, requirement: '7 jours', category: 'streak' },
  { id: 'streak_30', title: 'Mensuel', description: '30 jours de suite', icon: 'fire', color: 'var(--color-warning)', unlocked: false, progress: 0, requirement: '30 jours', category: 'streak' },
  { id: 'streak_100', title: 'Dedie', description: '100 jours de suite', icon: 'star', color: 'var(--color-primary)', unlocked: false, progress: 0, requirement: '100 jours', category: 'streak' },
  { id: 'first_review', title: 'Revisionne', description: "Revisez votre premier verset", icon: 'refresh', color: 'var(--color-primary-dark)', unlocked: false, progress: 0, requirement: '1 revision', category: 'review' },
  { id: 'fifty_reviews', title: 'Assidu', description: '50 revisions complétees', icon: 'checkmark-done', color: 'var(--color-success)', unlocked: false, progress: 0, requirement: '50 revisions', category: 'review' },
  { id: 'hundred_reviews', title: 'Perseverant', description: '100 revisions complétees', icon: 'star', color: 'var(--color-primary)', unlocked: false, progress: 0, requirement: '100 revisions', category: 'review' },
  { id: 'first_collection', title: 'Organisateur', description: "Creez votre premiere collection", icon: 'folder', color: 'var(--color-info)', unlocked: false, progress: 0, requirement: '1 collection', category: 'collection' },
  { id: 'five_collections', title: 'Archiviste', description: 'Creez 5 collections', icon: 'folders', color: 'var(--color-info)', unlocked: false, progress: 0, requirement: '5 collections', category: 'collection' },
  { id: 'patriarch', title: 'Patriarche', description: "Maitrisez tous les Psaumes", icon: 'medal', color: 'var(--color-warning)', unlocked: false, progress: 0, requirement: '150 versets Psaumes', category: 'special' },
  { id: 'gospel', title: 'Evangéliste', description: "Maitrisez tous les Evangiles", icon: 'globe', color: 'var(--color-primary)', unlocked: false, progress: 0, requirement: '91 versets Evangiles', category: 'special' },
];

/** 12% translucent tint of a token color, for soft circular backgrounds. */
const achievementTint = (color: string) => colorTintAlpha(color, 12);
/** 25% surface-blended tint of a token color, for card outline accents. */
const achievementTintBorder = (color: string) => colorTintSurface(color, 25);

const CATEGORIES: { id: 'all' | Cat; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'memorization', label: 'Memorisation' },
  { id: 'streak', label: 'Streak' },
  { id: 'review', label: 'Revisions' },
  { id: 'collection', label: 'Collections' },
  { id: 'special', label: 'Special' },
];

export default function AchievementScreen() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<'all' | Cat>('all');
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { activeProfile } = useActiveProfile();
  const profileId = activeProfile?.id ?? 'default';
  const [data, setData] = useState<{
    total: number;
    mastered: number;
    totalReviews: number;
    longest: number;
    collections: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const service = getMemorizationService(profileId);
        const [records, progress] = await Promise.all([
          service.getAllMemorized(),
          new ProgressService(service, getFsrsEngine(), undefined, profileId).getStats(),
        ]);
        if (cancelled) return;
        let collections = 0;
        try {
          const raw = localStorage.getItem('versyflow:collections');
          const parsed = raw ? (JSON.parse(raw) as Array<{ id: string }>) : [];
          collections = parsed.filter((c) => c.id.startsWith('c-')).length;
        } catch {
          /* none */
        }
        setData({
          total: records.length,
          mastered: records.filter((r) => r.status === 'mastered').length,
          totalReviews: records.reduce((s, r) => s + (r.reviewCount ?? 0), 0),
          longest: Math.max(progress.streakCount, progress.longestStreak),
          collections,
        });
      } catch (e) {
        console.error('[Achievements] data load failed:', e);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const derived = useMemo(() => {
    if (!data) return {};
    const rule = (threshold: number, value: number) => ({
      unlocked: value >= threshold,
      progress: Math.min(100, Math.round((value / threshold) * 100)),
    });
    const d: Record<string, { unlocked: boolean; progress: number }> = {};
    d.first_verse = rule(1, data.total);
    d.ten_verses = rule(10, data.total);
    d.fifty_verses = rule(50, data.total);
    d.hundred_verses = rule(100, data.total);
    d.streak_7 = rule(7, data.longest);
    d.streak_30 = rule(30, data.longest);
    d.streak_100 = rule(100, data.longest);
    d.first_review = rule(1, data.totalReviews);
    d.fifty_reviews = rule(50, data.totalReviews);
    d.hundred_reviews = rule(100, data.totalReviews);
    d.first_collection = rule(1, data.collections);
    d.five_collections = rule(5, data.collections);
    d.patriarch = rule(200, data.total);
    d.gospel = rule(50, data.mastered);
    return d;
  }, [data]);

  const achievements = useMemo(
    () => ACHIEVEMENTS.map((a) => ({ ...a, ...(derived[a.id] ?? { unlocked: false, progress: 0 }) })),
    [derived],
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const overall = (unlockedCount / achievements.length) * 100;
  const filtered =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);
  const displayed = showAll ? filtered : filtered.slice(0, 6);
  const selected = displayed.find((a) => a.id === selectedId) ?? null;

  return (
    <FullScreenPage
      title={t('nav.achievements', 'Succes')}
      showBack
      right={
        <span className="flex items-center gap-1 rounded-full bg-surface-tint px-3 py-1 text-sm font-semibold text-primary">
          <Star size={14} className="text-warning" />
          {unlockedCount}/{achievements.length}
        </span>
      }
    >
      <div className="mx-auto max-w-md space-y-5">
        {/* Overall */}
        <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-sm">
          <ProgressRing value={Math.round(overall)} size={72} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">
              {t('achievements.overall', 'Progression globale')}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {unlockedCount} {t('achievements.unlockedOn', 'succes debloques')} sur {achievements.length}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowAll(false);
              }}
              className={
                'rounded-full px-3.5 py-1.5 text-sm font-medium ' +
                (selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-tint text-text-secondary')
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {displayed.map((a) => {
            const Icon = a.unlocked ? ICON_MAP[a.icon] ?? Star : Lock;
            return (
              <button
                key={a.id}
                onClick={() => setSelectedId(selectedId === a.id ? null : a.id)}
                className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm"
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                  style={{
                    color: a.unlocked ? a.color : 'var(--color-text-muted)',
                    backgroundColor: achievementTint(a.color),
                  }}
                >
                  <Icon size={26} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-base font-bold"
                    style={{ color: a.unlocked ? a.color : 'var(--color-text-primary)' }}
                  >
                    {a.title}
                  </span>
                  <span className="text-sm text-text-muted">{a.description}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-tint">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: a.progress + '%', backgroundColor: a.color }}
                      />
                    </span>
                    <span className="w-10 text-right text-xs text-text-muted">
                      {a.progress >= 100 ? '100%' : a.progress + '%'}
                    </span>
                  </span>
                </span>
                {a.unlocked && (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: a.color }}
                  >
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div
            className="rounded-2xl bg-surface p-4 shadow-sm"
            style={{ borderColor: achievementTintBorder(selected.color) }}
          >
            <p className="text-base font-bold" style={{ color: selected.color }}>
              {selected.title}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{selected.description}</p>
            <p className="mt-2 text-xs text-text-muted">
              {t('achievements.condition', 'Condition')} : {selected.requirement}
            </p>
            {selected.unlocked && selected.unlockedAt && (
              <p className="mt-1 text-xs" style={{ color: selected.color }}>
                {t('achievements.unlockedAt', 'Debloe')} : {selected.unlockedAt}
              </p>
            )}
          </div>
        )}

        {filtered.length > 6 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-3 text-center text-sm font-semibold text-primary"
          >
            {t('achievements.showAll', 'Voir tous les succes')} ({filtered.length})
          </button>
        )}

        {/* Tips */}
        <div className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="mb-2 text-base font-bold text-text-primary">
            {t('achievements.howTo', 'Comment debloquer des succes')}
          </p>
          <div className="space-y-2">
            {[
              t('achievements.tip1', 'Memorisez des versets regulierement'),
              t('achievements.tip2', "Maintenez votre streak quotidien"),
              t('achievements.tip3', 'Creez des collections thematiques'),
            ].map((tip, i) => (
              <p key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 size={16} className="text-primary" />
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}
