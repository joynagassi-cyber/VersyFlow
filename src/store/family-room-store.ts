/**
 * Family Room Store — l'état des écrans « Famille » qui n'existent pas encore
 * côté serveur : défis d'équipe, séances partagées, fil d'activité, réglages
 * de famille, réactions.
 *
 * Pourquoi un store local et pas une table ?
 * ------------------------------------------
 * Le domaine `family` livré aujourd'hui porte les familles, les appartenances
 * et les invitations. Les défis et les séances n'ont **pas** d'entité : les
 * inventer dans le domaine aurait été plus long à défaire qu'à faire. Ce store
 * est donc explicitement un **état local, persisté, offline-first** : il
 * fonctionne sans réseau, il ne prétend pas être synchronisé, et l'écran de
 * synchronisation dit exactement ce qui est en attente. Quand les tables
 * arriveront, elles remplaceront ce store sans toucher aux écrans (même API).
 *
 * Les données sont volontairement minimales et dérivées de l'existant :
 *  - `familyId` relie un défi / une séance / une activité à la famille active ;
 *  - les participants sont identifiés par le nom affiché du profil (comme la
 *    liste des membres), pas par un identifiant inventé.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChallengeKind = 'passage' | 'collectif' | 'serie';
export type ChallengeUnit = 'verses' | 'reviews' | 'days';
export type SessionMode = 'flashcard' | 'writing' | 'masking';
export type ActivityKind = 'challenge-done' | 'level-up' | 'missed' | 'challenge-started';
export type ResetDay = 'monday' | 'sunday' | 'first-of-month';

export interface FamilyChallenge {
  id: string;
  familyId: string;
  title: string;
  kind: ChallengeKind;
  unit: ChallengeUnit;
  passage: string;
  target: number;
  durationDays: number;
  createdAt: number;
  participants: string[];
  /** Progression par participant (dans l'unité du défi). */
  progress: Record<string, number>;
  status: 'active' | 'done';
}

export interface FamilySessionParticipant {
  name: string;
  /** `online` = a rejoint en direct ; `offline` = mémorise en local. */
  state: 'online' | 'offline' | 'invited' | 'declined';
}

export interface FamilySession {
  id: string;
  familyId: string;
  passage: string;
  mode: SessionMode;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  participants: FamilySessionParticipant[];
  /** Cartes sues / cartes vues, par participant (pour le résumé de séance). */
  cards: Record<string, { known: number; total: number }>;
  /** Cartes restées en attente d'envoi (mode hors ligne). */
  pending: number;
}

export interface FamilyActivityEntry {
  id: string;
  familyId: string;
  actor: string;
  kind: ActivityKind;
  target: string;
  at: number;
  /** Réactions prédéfinies uniquement (pas de texte libre) : clé → nombre. */
  reactions: Record<string, number>;
}

export interface FamilyRoomSettings {
  resetDay: ResetDay;
  /** Sinon, seul le rang est visible (pas les points). */
  showScores: boolean;
  showAliases: boolean;
  wifiOnlySync: boolean;
}

const DEFAULT_SETTINGS: FamilyRoomSettings = {
  resetDay: 'monday',
  showScores: true,
  showAliases: true,
  wifiOnlySync: false,
};

export interface FamilyRoomState {
  challenges: FamilyChallenge[];
  sessions: FamilySession[];
  activities: FamilyActivityEntry[];
  settings: Record<string, FamilyRoomSettings>;

  createChallenge: (
    input: Pick<FamilyChallenge, 'familyId' | 'title' | 'kind' | 'unit' | 'passage' | 'target' | 'durationDays' | 'participants'>,
  ) => FamilyChallenge;
  joinChallenge: (challengeId: string, participant: string) => void;
  advanceChallenge: (challengeId: string, participant: string, amount?: number) => void;
  completeChallenge: (challengeId: string) => void;

  planSession: (input: Pick<FamilySession, 'familyId' | 'passage' | 'mode' | 'participants'>) => FamilySession;
  startSession: (sessionId: string) => void;
  endSession: (sessionId: string) => void;
  recordCards: (sessionId: string, participant: string, known: number, total: number) => void;

  addActivity: (input: Pick<FamilyActivityEntry, 'familyId' | 'actor' | 'kind' | 'target'>) => void;
  react: (activityId: string, reaction: string) => void;

  updateSettings: (familyId: string, patch: Partial<FamilyRoomSettings>) => void;
  settingsFor: (familyId: string) => FamilyRoomSettings;

  /** Efface l'état d'une famille (quitter / réinitialiser). */
  clearFamily: (familyId: string) => void;
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useFamilyRoomStore = create<FamilyRoomState>()(
  persist(
    (set, get) => ({
      challenges: [],
      sessions: [],
      activities: [],
      settings: {},

      createChallenge: (input) => {
        const challenge: FamilyChallenge = {
          ...input,
          id: uid('ch'),
          createdAt: Date.now(),
          progress: Object.fromEntries(input.participants.map((p) => [p, 0])),
          status: 'active',
        };
        set((state) => ({ challenges: [challenge, ...state.challenges] }));
        get().addActivity({
          familyId: challenge.familyId,
          actor: challenge.participants[0] ?? '',
          kind: 'challenge-started',
          target: challenge.title,
        });
        return challenge;
      },

      joinChallenge: (challengeId, participant) =>
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id !== challengeId || c.participants.includes(participant)
              ? c
              : {
                  ...c,
                  participants: [...c.participants, participant],
                  progress: { ...c.progress, [participant]: 0 },
                },
          ),
        })),

      advanceChallenge: (challengeId, participant, amount = 1) =>
        set((state) => ({
          challenges: state.challenges.map((c) => {
            if (c.id !== challengeId) return c;
            const next = Math.min(c.target, (c.progress[participant] ?? 0) + amount);
            return { ...c, progress: { ...c.progress, [participant]: next } };
          }),
        })),

      completeChallenge: (challengeId) => {
        const challenge = get().challenges.find((c) => c.id === challengeId);
        set((state) => ({
          challenges: state.challenges.map((c) =>
            c.id === challengeId ? { ...c, status: 'done' } : c,
          ),
        }));
        if (challenge) {
          get().addActivity({
            familyId: challenge.familyId,
            actor: challenge.participants[0] ?? '',
            kind: 'challenge-done',
            target: challenge.title,
          });
        }
      },

      planSession: (input) => {
        const session: FamilySession = {
          ...input,
          id: uid('se'),
          createdAt: Date.now(),
          startedAt: null,
          endedAt: null,
          cards: {},
          pending: 0,
        };
        set((state) => ({ sessions: [session, ...state.sessions] }));
        return session;
      },

      startSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, startedAt: s.startedAt ?? Date.now() } : s,
          ),
        })),

      endSession: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, endedAt: Date.now() } : s,
          ),
        })),

      recordCards: (sessionId, participant, known, total) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, cards: { ...s.cards, [participant]: { known, total } } }
              : s,
          ),
        })),

      addActivity: (input) =>
        set((state) => ({
          activities: [
            { ...input, id: uid('ac'), at: Date.now(), reactions: {} },
            ...state.activities,
          ].slice(0, 100),
        })),

      react: (activityId, reaction) =>
        set((state) => ({
          activities: state.activities.map((a) =>
            a.id === activityId
              ? { ...a, reactions: { ...a.reactions, [reaction]: (a.reactions[reaction] ?? 0) + 1 } }
              : a,
          ),
        })),

      updateSettings: (familyId, patch) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [familyId]: { ...(state.settings[familyId] ?? DEFAULT_SETTINGS), ...patch },
          },
        })),

      settingsFor: (familyId) => get().settings[familyId] ?? DEFAULT_SETTINGS,

      clearFamily: (familyId) =>
        set((state) => ({
          challenges: state.challenges.filter((c) => c.familyId !== familyId),
          sessions: state.sessions.filter((s) => s.familyId !== familyId),
          activities: state.activities.filter((a) => a.familyId !== familyId),
          settings: Object.fromEntries(
            Object.entries(state.settings).filter(([id]) => id !== familyId),
          ),
        })),
    }),
    {
      name: 'versyflow-family-room',
      partialize: (state) => ({
        challenges: state.challenges,
        sessions: state.sessions,
        activities: state.activities,
        settings: state.settings,
      }),
    },
  ),
);

export const FAMILY_ROOM_DEFAULTS = DEFAULT_SETTINGS;
