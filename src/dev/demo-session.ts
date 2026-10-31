/**
 * Session de démonstration — cycle de vie explicite.
 *
 * Ce que la démo est :
 *   - un **espace de stockage séparé** (clés préfixées `versyflow:mock-scope:v1:`),
 *   - des **repositories mock** (versets, révisions, familles, profils),
 *   - **aucun** appel Supabase / PowerSync / notification réelle.
 *
 * Ce qu'elle n'est pas : une simple bascule d'affichage. Le mode démo ne lit et
 * n'écrit jamais les clés réelles de l'utilisateur (voir `mock/storage-scope.ts`).
 *
 * Durée de vie : les données de démo vivent dans le navigateur, sous le préfixe
 * ci-dessus, jusqu'à « Réinitialiser la démo » (effacement du seul espace de
 * démo) ou jusqu'au nettoyage du stockage du navigateur. Elles survivent aux
 * rechargements et à une sortie de démo : on peut donc sortir, vérifier ses
 * vraies données, puis revenir exactement dans le même état de démo.
 *
 * Ce module ne prend **aucune** décision d'affichage : il expose des fonctions
 * utilisées par le panneau `/dev`, l'écran `/settings/data` et le bandeau.
 */

import { getDataMode, isMockMode, setDataMode, type DataMode } from './mode';
import {
  clearDemoStorage,
  demoStorageFootprint,
  getStorageIsolationState,
  listDemoStorageKeys,
} from './mock/storage-scope';
import { mockDb } from './mock/db';
import { ensureMockSeed, resetMockDatabase } from './mock/seed';
import { resetMockFamilyRoom, seedMockFamilyRoom } from './mock/family-room-seed';

/** Clés de contrôle (hors espace de démo, voir `storage-scope.ts`). */
const DEMO_STARTED_KEY = 'versyflow:demo:started-at';
const DEMO_VERSION_KEY = 'versyflow:demo:version';

/** Incrémenter quand la forme des graines change de façon incompatible. */
export const DEMO_DATA_VERSION = '2026-10-30.1';

function readControl(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeControl(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {
    /* quota / navigation privée : la démo reste utilisable en mémoire */
  }
}

function removeControl(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export interface DemoSessionInfo {
  active: boolean;
  mode: DataMode;
  startedAt: number | null;
  storageKeys: number;
  storageBytes: number;
  isolationInstalled: boolean;
  counts: Record<string, number>;
  versions: { data: string; stored: string | null };
}

/** État complet de la démo, pour l'UI et les tests. */
export function getDemoSessionInfo(): DemoSessionInfo {
  const raw = readControl(DEMO_STARTED_KEY);
  const startedAt = raw ? Number(raw) : null;
  const footprint = demoStorageFootprint();
  const state = getStorageIsolationState();
  return {
    active: isMockMode(),
    mode: getDataMode(),
    startedAt: Number.isFinite(startedAt) ? startedAt : null,
    storageKeys: footprint.keys,
    storageBytes: footprint.bytes,
    isolationInstalled: state.installed,
    counts: { ...mockDb.counts() },
    versions: { data: DEMO_DATA_VERSION, stored: readControl(DEMO_VERSION_KEY) },
  };
}

/**
 * Marque le début de la session de démo (premier boot en mode mock) et
 * enregistre la version des graines utilisée.
 */
export function markDemoSessionStarted(): DemoSessionInfo {
  if (!readControl(DEMO_STARTED_KEY)) {
    writeControl(DEMO_STARTED_KEY, String(Date.now()));
  }
  writeControl(DEMO_VERSION_KEY, DEMO_DATA_VERSION);
  return getDemoSessionInfo();
}

/**
 * Réinitialise la démo : efface **uniquement** l'espace de démo puis re-sème.
 * Retourne le nombre de clés effacées. L'appelant recharge l'application
 * (`reloadDemoSession`) pour que les stores Zustand repartent de la graine.
 */
export function resetDemoSession(): { clearedKeys: number; seeded: boolean } {
  if (!isMockMode()) return { clearedKeys: 0, seeded: false };

  const clearedKeys = clearDemoStorage();
  // L'état en mémoire doit aussi repartir de zéro : sinon un store déjà monté
  // réécrirait les anciennes valeurs au prochain rendu.
  resetMockFamilyRoom();
  mockDb.reset();
  const seed = resetMockDatabase();
  seedMockFamilyRoom({ force: true });
  markDemoSessionStarted();
  return { clearedKeys, seeded: seed.seeded };
}

/** Réinitialise puis recharge (l'appelant n'a plus rien à faire). */
export function reloadDemoSession(): void {
  resetDemoSession();
  if (typeof window !== 'undefined') window.location.reload();
}

/**
 * Sort de la démo vers les **données réelles**. Les données de démo restent en
 * place (isolation), ce qui permet d'y revenir avec `?data=mock`.
 */
export function exitDemoSession(): void {
  setDataMode('live');
  if (typeof window !== 'undefined') window.location.reload();
}

/** Re-entre dans la démo si l'utilisateur en était sorti. */
export function reenterDemoSession(): void {
  setDataMode('mock');
  if (typeof window !== 'undefined') window.location.reload();
}

/** Oublie le choix explicite (retour à la résolution automatique). */
export function forgetDataModeChoice(): void {
  removeControl('versyflow:data-mode');
  if (typeof window !== 'undefined') window.location.reload();
}

/**
 * Garantit que la base de démo est semée (idempotent). Utilisé par le panneau
 * `/dev` après une réinitialisation partielle.
 */
export function ensureDemoData(): boolean {
  if (!isMockMode()) return false;
  ensureMockSeed();
  seedMockFamilyRoom();
  markDemoSessionStarted();
  return true;
}

/** Liste brute des clés de démo (diagnostic / export). */
export function demoStorageKeyList(): string[] {
  return listDemoStorageKeys().map((key) => key.replace('versyflow:mock-scope:v1:', ''));
}
