/**
 * Graines de démonstration pour les écrans Famille « riches ».
 *
 * `useFamilyRoomStore` porte ce qui n'a pas encore d'entité serveur : défis,
 * séances partagées, fil d'activité, réglages de famille. Sans graine, ces
 * écrans s'ouvrent vides en démo, et l'utilisateur ne peut pas tester le
 * classement, les défis ou les séances — alors que c'est précisément ce qu'il
 * demande de pouvoir essayer.
 *
 * Règles :
 *  - **démo uniquement** (`isMockMode()`), jamais en mode live ;
 *  - **idempotent** : si des défis / séances / activités existent déjà, on ne
 *    touche à rien (les manipulations de test restent en place au rechargement) ;
 *  - **cohérent avec la base mock** : la famille et les noms viennent des
 *    collections `families` / `learner_profiles`, jamais d'inventions ;
 *  - tout est stocké sous l'espace isolé de la démo (voir `storage-scope.ts`).
 */

import { isMockMode } from '@/dev/mode';
import { mockDb } from './db';
import {
  useFamilyRoomStore,
  type FamilyActivityEntry,
  type FamilyChallenge,
  type FamilySession,
} from '@/store/family-room-store';
import type { Family } from '@/domains/family';
import type { LearnerProfile } from '@/domains/learner-profile';

interface StoredFamily extends Family {
  ownerId: string;
}

const DAY = 86_400_000;

export interface FamilyRoomSeedResult {
  seeded: boolean;
  familyId: string | null;
  challenges: number;
  sessions: number;
  activities: number;
}

function firstFamily(): string | null {
  const families = mockDb.list<StoredFamily>('families');
  return families[0]?.id ?? null;
}

function profileNames(familyId: string): string[] {
  const memberships = mockDb.list<{ familyId: string; accountId: string; status: string }>(
    'family_memberships',
  );
  const accountIds = new Set(
    memberships
      .filter((m) => m.familyId === familyId && m.status === 'active')
      .map((m) => m.accountId),
  );
  const profiles = mockDb.list<LearnerProfile>('learner_profiles');
  const names = profiles
    .filter((p) => accountIds.has(p.accountId))
    .map((p) => p.displayName?.trim())
    .filter((name): name is string => Boolean(name));
  return Array.from(new Set(names));
}

/**
 * Sème défis, séances et fil d'activité pour la famille de démo.
 * No-op hors démo, sans famille, ou si l'état n'est pas vide.
 */
export function seedMockFamilyRoom(options: { force?: boolean } = {}): FamilyRoomSeedResult {
  const empty: FamilyRoomSeedResult = {
    seeded: false,
    familyId: null,
    challenges: 0,
    sessions: 0,
    activities: 0,
  };
  if (!isMockMode()) return empty;

  const familyId = firstFamily();
  if (!familyId) return empty;

  const state = useFamilyRoomStore.getState();
  const alreadySeeded =
    state.challenges.some((c) => c.familyId === familyId) ||
    state.sessions.some((s) => s.familyId === familyId) ||
    state.activities.some((a) => a.familyId === familyId);
  if (alreadySeeded && !options.force) {
    return {
      ...empty,
      familyId,
      challenges: state.challenges.length,
      sessions: state.sessions.length,
      activities: state.activities.length,
    };
  }

  const names = profileNames(familyId);
  const me = names[0] ?? 'Ami de la Parole';
  const companions = names.slice(1);
  const participants = companions.length ? [me, ...companions] : [me];
  const now = Date.now();

  const challenges: FamilyChallenge[] = [
    {
      id: `ch-demo-${familyId.slice(-6)}-1`,
      familyId,
      title: 'Psaume 23 en 7 jours',
      kind: 'collectif',
      unit: 'verses',
      passage: 'Psaumes 23',
      target: 6,
      durationDays: 7,
      createdAt: now - 3 * DAY,
      participants,
      progress: Object.fromEntries(participants.map((p) => [p, p === me ? 4 : 2])),
      status: 'active',
    },
    {
      id: `ch-demo-${familyId.slice(-6)}-2`,
      familyId,
      title: 'Une révision par jour',
      kind: 'serie',
      unit: 'days',
      passage: 'Jean 3:16',
      target: 5,
      durationDays: 5,
      createdAt: now - 6 * DAY,
      participants,
      progress: Object.fromEntries(participants.map((p) => [p, p === me ? 5 : 4])),
      status: 'done',
    },
  ];

  const sessions: FamilySession[] = [
    {
      id: `se-demo-${familyId.slice(-6)}-1`,
      familyId,
      passage: 'Psaumes 23:1-3',
      mode: 'flashcard',
      createdAt: now - DAY,
      startedAt: now - DAY,
      endedAt: now - DAY + 18 * 60_000,
      cards: Object.fromEntries(participants.map((p) => [p, { known: 3, total: 3 }])),
      pending: 0,
      participants: participants.map((name, index) => ({
        name,
        state: index === 0 ? 'online' : 'offline',
      })),
    },
  ];

  const activities: FamilyActivityEntry[] = [
    {
      id: `ac-demo-${familyId.slice(-6)}-1`,
      familyId,
      actor: me,
      kind: 'challenge-started',
      target: 'Psaume 23 en 7 jours',
      at: now - 3 * DAY,
      reactions: { '🙏': 2 },
    },
    {
      id: `ac-demo-${familyId.slice(-6)}-2`,
      familyId,
      actor: companions[0] ?? me,
      kind: 'level-up',
      target: 'Jean 3:16 maîtrisé',
      at: now - 2 * DAY,
      reactions: { '🎉': 3 },
    },
    {
      id: `ac-demo-${familyId.slice(-6)}-3`,
      familyId,
      actor: me,
      kind: 'challenge-done',
      target: 'Une révision par jour',
      at: now - DAY / 2,
      reactions: {},
    },
  ];

  // On ne touche pas aux réglages : la graine ne doit pas écraser un choix
  // fait par l'utilisateur dans l'écran Réglages de la famille.
  useFamilyRoomStore.setState({ challenges, sessions, activities });

  return {
    seeded: true,
    familyId,
    challenges: challenges.length,
    sessions: sessions.length,
    activities: activities.length,
  };
}

/** Remet l'état Famille de démo à zéro (utilisé par « Réinitialiser la démo »). */
export function resetMockFamilyRoom(): void {
  const familyId = firstFamily();
  useFamilyRoomStore.setState({
    challenges: [],
    sessions: [],
    activities: [],
    settings: familyId
      ? Object.fromEntries(
          Object.entries(useFamilyRoomStore.getState().settings).filter(([id]) => id !== familyId),
        )
      : {},
  });
}
