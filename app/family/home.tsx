/**
 * Famille — Hub (kit `m1_famille_hub`).
 *
 * L'écran reprend la hiérarchie de la maquette : profil actif, carte « série »
 * en dégradé, défi en cours, classement de la semaine, raccourcis.
 *
 * **Ce qui est mesuré, et ce qui ne l'est pas.** Tout nombre affiché ici est
 * calculé sur le stockage local du compte :
 *  - la série compte les jours consécutifs qui portent au moins une entrée dans
 *    le fil d'activité de la famille (`useFamilyRoomStore`) ;
 *  - « aujourd'hui » compare les membres ayant une entrée du jour au nombre de
 *    membres chargés ;
 *  - le classement additionne les points de défi (`pointsForChallenge`).
 * Sans données, on affiche un tiret et « non mesuré » — jamais un 0 qui se
 * ferait passer pour une mesure.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  PlusSignIcon as Plus,
  LogInIcon as LogIn,
  ArrowRight01Icon as ArrowRight,
  CheckmarkCircle02Icon as CheckCircle,
  AlertCircleIcon as AlertCircle,
  Loading03Icon as Loader2,
  UserMultiple02Icon as Users,
  ChampionIcon as Trophy,
  FireIcon as Flame,
  NoteIcon as Note,
  HierarchyIcon as Tree,
  Time04Icon as Clock,
  Settings02Icon as Settings,
} from '@/components/ui/solar-icons';
import FullScreenPage from '@/components/layout/FullScreenPage';
import { FamilyDemo } from '@/components/family/FamilyDemo';
import { isMockMode } from '@/dev/mode';
import { Button } from '@/components/ui/button';
import { HintNote, MemberAvatar, ProgressBar, SectionCard } from '@/components/family/FamilyKit';
import { cn } from '@/lib/utils';
import { useFamilySyncStore } from '@/store/family-sync-store';
import { useFamilyService } from '@/hooks/useFamilyService';
import { useFamilyRoom } from '@/hooks/useFamilyRoom';
import { useFamilyRoomStore } from '@/store/family-room-store';
import { useActiveProfile } from '@/hooks/useActiveProfile';
import { useAuthStore } from '@/store/auth-store';
import { pointsForChallenge } from '@/services/family-scoring';

const DAY = 86_400_000;

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function RealFamilyHomeScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const families = useFamilySyncStore((s) => s.families);
  const activeFamilyId = useFamilySyncStore((s) => s.activeFamilyId);
  const setActiveFamily = useFamilySyncStore((s) => s.setActiveFamily);
  const addFamily = useFamilySyncStore((s) => s.addFamily);
  const { createFamily } = useFamilyService();
  const signedIn = Boolean(useAuthStore((s) => s.user?.userId));
  const { activeProfile } = useActiveProfile();
  const { familyId, members } = useFamilyRoom();
  const activities = useFamilyRoomStore((s) => s.activities);
  const challenges = useFamilyRoomStore((s) => s.challenges);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const activeFamily = families.find((f) => f.id === activeFamilyId) || null;

  const selectFamily = (familyIdToSelect: string) => {
    setActiveFamily(familyIdToSelect);
    navigate('/family/members');
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const family = await createFamily(name);
      // The PowerSync bridge re-lists families from the DB; addFamily() is
      // idempotent so this also covers offline (local write is pending sync).
      addFamily(family);
      setActiveFamily(family.id);
      setNewName('');
      navigate('/family/members');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('createFamily failed', e);
      setCreateError(
        e instanceof Error ? e.message : t('errors.unknownError', 'Une erreur inattendue est survenue'),
      );
    } finally {
      setCreating(false);
    }
  };

  const daysAgo = (createdAt: number) =>
    Math.max(0, Math.floor((Date.now() - createdAt) / DAY));

  // ── Mesures locales ────────────────────────────────────────────────────────
  const scopedActivities = useMemo(
    () => activities.filter((a) => a.familyId === familyId),
    [activities, familyId],
  );

  const streak = useMemo(() => {
    if (scopedActivities.length === 0) return null;
    const days = new Set(scopedActivities.map((a) => startOfDay(a.at)));
    let cursor = startOfDay(Date.now());
    // Une série peut démarrer hier si rien n'a encore été fait aujourd'hui.
    if (!days.has(cursor)) cursor -= DAY;
    let count = 0;
    while (days.has(cursor)) {
      count += 1;
      cursor -= DAY;
    }
    return count;
  }, [scopedActivities]);

  const todayActors = useMemo(() => {
    const today = startOfDay(Date.now());
    return new Set(
      scopedActivities.filter((a) => startOfDay(a.at) === today).map((a) => a.actor),
    );
  }, [scopedActivities]);

  const todayReviewed = members.filter((m) => todayActors.has(m.name)).length;
  const todayPct = members.length > 0 ? Math.round((todayReviewed / members.length) * 100) : 0;

  const runningChallenge = useMemo(
    () =>
      challenges.find((c) => c.familyId === familyId && c.status === 'active') ?? null,
    [challenges, familyId],
  );

  const leaderRows = useMemo(() => {
    const since = Date.now() - 7 * DAY;
    const scoped = challenges.filter((c) => c.familyId === familyId && c.createdAt >= since);
    return members
      .map((member) => ({
        ...member,
        points: scoped.reduce((sum, c) => sum + pointsForChallenge(c, member.name), 0),
      }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, 3);
  }, [challenges, familyId, members]);

  const shortcuts = [
    { label: t('familyPlus.members', 'Membres'), icon: Users, to: '/family/members' },
    { label: t('familyPlus.challengesTitle', 'Défis d’équipe'), icon: Trophy, to: '/family/challenges' },
    { label: t('familyPlus.pointsTitle', 'Points et niveaux'), icon: Flame, to: '/family/points' },
    { label: t('familyPlus.activityTitle', 'Activité'), icon: Clock, to: '/family/activity' },
    { label: t('familyPlus.semanticTree', 'Arbre sémantique'), icon: Tree, to: '/semantic/tags' },
    { label: t('notes.title', 'Notes'), icon: Note, to: '/notes' },
    { label: t('familyPlus.familySettingsTitle', 'Réglages famille'), icon: Settings, to: '/family/settings' },
  ];

  return (
    <FullScreenPage
      title={activeFamily?.name ?? t('family.contextFamily', 'Ma Famille')}
      subtitle={
        activeFamily
          ? t('familyPlus.membersCount', '{{count}} membres', { count: members.length })
          : undefined
      }
      backPath="/tabs/home"
      right={
        <button
          onClick={() => navigate('/family/invite')}
          className="rounded-full bg-surface-tint p-2"
          aria-label={t('family.invite', 'Inviter')}
        >
          <DuoIcon icon={Plus} size={18} className="text-primary" />
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {activeFamily ? (
          <>
            {/* Profil actif */}
            <SectionCard title={t('familyPlus.youMemorizeAs', 'Tu mémorises en tant que')}>
              <div className="flex items-center gap-3">
                <MemberAvatar name={activeProfile?.displayName ?? '?'} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {activeProfile?.displayName ?? t('familyPlus.noLocalProfile', 'Aucun profil sur cet appareil')}
                  </p>
                  <p className="truncate text-xs italic text-text-muted">
                    {activeProfile?.slogan?.trim() || t('familyPlus.noAlias', 'Pas d’alias pour l’instant')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/family/select-profile')}
                >
                  {t('familyPlus.change', 'Changer')}
                </Button>
              </div>
            </SectionCard>

            {/* Carte série */}
            <div className="relative overflow-hidden rounded-[28px] bg-primary p-5 text-on-primary shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {t('familyPlus.familyStreak', 'Série de la famille')}
                  </p>
                  <p className="mt-1 text-4xl font-bold tabular-nums">
                    {streak === null ? '—' : streak}
                    {streak !== null && (
                      <span className="ml-2 text-sm font-semibold opacity-80">
                        {t('familyPlus.unitDays', 'jours')}
                      </span>
                    )}
                  </p>
                  {streak === null && (
                    <p className="mt-1 text-xs opacity-80">{t('familyPlus.notMeasured', 'non mesuré')}</p>
                  )}
                </div>
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--color-primary-foreground, #fff) ${todayPct}%, color-mix(in srgb, var(--color-primary-foreground, #fff) 22%, transparent) 0)`,
                  }}
                  role="img"
                  aria-label={t('familyPlus.todayRatio', '{{done}} membres sur {{total}} ont révisé aujourd’hui', {
                    done: todayReviewed,
                    total: members.length,
                  })}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-sm font-bold tabular-nums">
                    {todayPct}%
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((member) => (
                    <span
                      key={member.accountId}
                      className={cn(
                        'ring-2 ring-primary',
                        todayActors.has(member.name) ? 'opacity-100' : 'opacity-50',
                      )}
                    >
                      <MemberAvatar name={member.name} size={26} muted={!todayActors.has(member.name)} />
                    </span>
                  ))}
                </div>
                <p className="text-xs opacity-90">
                  {t('familyPlus.todayRatio', '{{done}} membres sur {{total}} ont révisé aujourd’hui', {
                    done: todayReviewed,
                    total: members.length,
                  })}
                </p>
              </div>
            </div>

            {/* Défi en cours */}
            <SectionCard
              title={t('familyPlus.runningChallenge', 'Défi en cours')}
              action={
                <button
                  onClick={() => navigate('/family/challenges')}
                  className="text-xs font-semibold text-primary"
                >
                  {t('familyPlus.seeAll', 'Voir tout')}
                </button>
              }
            >
              {runningChallenge ? (
                <button
                  type="button"
                  onClick={() => navigate(`/family/challenges/${runningChallenge.id}`)}
                  className="w-full text-left"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {runningChallenge.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-bold text-primary tabular-nums">
                      {t('familyPlus.daysLeft', 'J-{{days}}', {
                        days: Math.max(
                          0,
                          runningChallenge.durationDays -
                            Math.floor((Date.now() - runningChallenge.createdAt) / DAY),
                        ),
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {t('familyPlus.participantsShort', 'participants')} ·{' '}
                    {t('familyPlus.membersDoneShort', 'Terminé')} {runningChallenge.participants.filter(
                      (p) => (runningChallenge.progress[p] ?? 0) >= runningChallenge.target,
                    ).length}
                    /{runningChallenge.participants.length}
                  </p>
                  <ProgressBar
                    className="mt-2"
                    value={Object.values(runningChallenge.progress).reduce((a, b) => a + b, 0)}
                    max={Math.max(1, runningChallenge.target * runningChallenge.participants.length)}
                    label={runningChallenge.title}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/family/challenges/new')}
                  className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-tint p-3 text-left"
                >
                  <span className="text-sm font-semibold text-text-primary">
                    {t('familyPlus.launchNewChallenge', 'Lancer un nouveau défi')}
                  </span>
                  <DuoIcon icon={ArrowRight} size={16} className="text-primary" />
                </button>
              )}
            </SectionCard>

            {/* Classement de la semaine */}
            <SectionCard
              title={t('familyPlus.weeklyLeaderboard', 'Classement de la semaine')}
              action={
                <button
                  onClick={() => navigate('/family/leaderboard')}
                  className="text-xs font-semibold text-primary"
                >
                  {t('familyPlus.seeAll', 'Voir tout')}
                </button>
              }
            >
              {leaderRows.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t('familyPlus.noMembers', 'Aucun membre pour l’instant')}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {leaderRows.map((row, index) => (
                    <li key={row.accountId}>
                      <button
                        type="button"
                        onClick={() => navigate(`/family/member/${encodeURIComponent(row.accountId)}`)}
                        className="flex w-full items-center gap-3 rounded-xl p-1 text-left"
                      >
                        <span className="w-4 text-center text-sm font-bold tabular-nums text-text-muted">
                          {index + 1}
                        </span>
                        <MemberAvatar name={row.name} size={32} />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
                          {row.name}
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                          {row.points} {t('familyPlus.pts', 'pts')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Raccourcis */}
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.to}
                  type="button"
                  onClick={() => navigate(shortcut.to)}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3 text-left shadow-sm"
                >
                  <DuoIcon icon={shortcut.icon} size={18} className="shrink-0 text-primary" />
                  <span className="truncate text-xs font-semibold text-text-primary">
                    {shortcut.label}
                  </span>
                </button>
              ))}
            </div>

            <HintNote>
              {t(
                'familyPlus.hubMeasured',
                'Série, participation du jour et classement sont calculés sur cet appareil à partir du fil d’activité et des défis locaux. Ce qui n’a pas encore été mesuré affiche un tiret.',
              )}
            </HintNote>
          </>
        ) : (
          <div className="flex flex-col items-center rounded-2xl bg-surface p-8 text-center shadow-sm">
            <span className="text-5xl">👨‍👩‍👧‍👦</span>
            <p className="mt-4 text-lg font-bold text-text-primary tabular-nums">
              {families.length === 0
                ? t('family.noFamiliesYet', 'Aucune famille pour l’instant')
                : t('family.noFamily', 'Aucune famille active')}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {t('family.createFamily', 'Créez une famille')} {t('family.shareDesc', 'pour partager votre progression')}
            </p>
            {!signedIn && (
              <p className="mt-3 text-xs text-text-muted">
                {t('family.signedInRequired', 'Connectez-vous pour créer ou rejoindre une famille')}
              </p>
            )}
            <Button className="mt-4" onClick={() => navigate('/family/create')}>
              {t('family.createFamily', 'Créer une famille')}
            </Button>
          </div>
        )}

        {/* Créer / rejoindre, toujours accessible */}
        <SectionCard title={t('familyPlus.familySection', 'Famille')}>
          <div className="flex flex-col gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('family.familyNamePlaceholder', 'Ex. Famille Martin')}
              aria-label={t('family.familyName', 'Nom de la famille')}
              maxLength={40}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {createError && (
              <p className="flex items-center gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
                <DuoIcon icon={AlertCircle} size={14} className="shrink-0" />
                {createError}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => {
                void handleCreate();
              }}
              disabled={!signedIn || creating || !newName.trim()}
            >
              {creating ? (
                <DuoIcon icon={Loader2} size={16} className="animate-spin" />
              ) : (
                <DuoIcon icon={Plus} size={16} />
              )}
              {creating ? t('common.loading', 'Chargement…') : t('family.createFamily', 'Créer une famille')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/family/join')}>
              <DuoIcon icon={LogIn} size={16} />
              {t('family.joinButton', 'Rejoindre la famille')}
            </Button>
          </div>
        </SectionCard>

        {/* Familles récentes */}
        {families.length > 0 && (
          <SectionCard title={t('familyPlus.recentFamilies', 'Familles récentes')}>
            <div className="flex flex-col gap-2">
              {families.map((family) => (
                <button
                  key={family.id}
                  onClick={() => selectFamily(family.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl bg-surface p-3 text-left',
                    activeFamilyId === family.id && 'ring-1 ring-primary',
                  )}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
                    style={{ backgroundColor: `${family.color}20` }}
                  >
                    {family.icon}
                  </span>
                  <span className="flex-1">
                    <p className="text-base font-semibold text-text-primary">{family.name}</p>
                    <p className="text-xs text-text-muted">
                      {t('family.familyMember', 'Créée il y a')} {daysAgo(family.createdAt)} j
                    </p>
                  </span>
                  {activeFamilyId === family.id && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-semibold text-primary">
                      <DuoIcon icon={CheckCircle} size={12} />
                      {t('family.familyActive', 'Actif')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </FullScreenPage>
  );
}

/** Le prototype famille est séparé des services et données de la famille réelle. */
export default function FamilyHomeScreen() {
  const [real, setReal] = useState(false);
  return isMockMode() || real ? <RealFamilyHomeScreen /> : <FamilyDemo onReal={() => setReal(true)} />;
}
