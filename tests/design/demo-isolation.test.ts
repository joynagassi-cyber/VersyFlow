/**
 * Démo — isolation réelle du stockage.
 *
 * Ces tests ne vérifient pas un rendu : ils vérifient la **garantie** demandée
 * par le chantier — pendant la démo, aucune donnée réelle n'est lue ni écrite,
 * et la sortie de démo retrouve exactement l'état précédent.
 *
 * Ils s'exécutent sur le vrai `localStorage` de jsdom, avec la même redirection
 * que celle installée au boot par `src/dev/mock/install-isolation.ts`.
 */

/* eslint-disable @typescript-eslint/unbound-method -- on capture volontairement
   les méthodes natives de `Storage` pour les appeler avec `.call(window.localStorage)` :
   c'est le seul moyen de lire l'emplacement réel sans passer par la redirection. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Méthodes Storage natives capturées **avant** toute installation : c'est le
 * seul moyen de lire l'emplacement réel sans passer par la redirection.
 */
const NATIVE_GET_ITEM = Storage.prototype.getItem;
const NATIVE_SET_ITEM = Storage.prototype.setItem;
const NATIVE_REMOVE_ITEM = Storage.prototype.removeItem;
const NATIVE_CLEAR = Storage.prototype.clear;

function rawGet(key: string): string | null {
  return NATIVE_GET_ITEM.call(window.localStorage, key);
}

const REAL_COLLECTIONS = 'versyflow:collections';
const REAL_SEARCH = 'versyflow:search:history';
const PREFIX = 'versyflow:mock-scope:v1:';

async function loadModeModule() {
  vi.resetModules();
  return import('@/dev/mode');
}

async function loadScopeModule() {
  vi.resetModules();
  const mode = await import('@/dev/mode');
  // Le mode doit être résolu avant d'installer la redirection.
  const scope = await import('@/dev/mock/storage-scope');
  return { mode, scope };
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  // Restaure la classe Storage quoi qu'il arrive (les modules sont réinitialisés
  // entre les tests, donc on restaure depuis les références natives capturées).
  Storage.prototype.getItem = NATIVE_GET_ITEM;
  Storage.prototype.setItem = NATIVE_SET_ITEM;
  Storage.prototype.removeItem = NATIVE_REMOVE_ITEM;
  Storage.prototype.clear = NATIVE_CLEAR;
  vi.unstubAllEnvs();
  vi.resetModules();
  NATIVE_CLEAR.call(window.localStorage);
  window.history.replaceState({}, '', '/');
});

describe('résolution du mode de données', () => {
  it('ouvre en démo par défaut (chantier démo)', async () => {
    const mode = await loadModeModule();
    expect(mode.getDataMode()).toBe('mock');
    expect(mode.describeDataMode()).toContain('MOCK');
  });

  it('permet une sortie explicite par l’URL ?data=live', async () => {
    window.history.replaceState({}, '', '/?data=live');
    const mode = await loadModeModule();
    expect(mode.getDataMode()).toBe('live');
    expect(localStorage.getItem('versyflow:data-mode')).toBe('live');
  });

  it('permet de désactiver la démo par défaut via VITE_DEMO_DEFAULT=off', async () => {
    const mode = await loadModeModule();
    expect(mode.isDemoDefaultEnabled({})).toBe(true);
    expect(mode.isDemoDefaultEnabled({ VITE_DEMO_DEFAULT: 'off' })).toBe(false);
    expect(mode.isDemoDefaultEnabled({ VITE_DEMO_DEFAULT: 'live' })).toBe(false);
    expect(mode.isDemoDefaultEnabled({ VITE_DEMO_DEFAULT: 'on' })).toBe(true);
  });
});

describe('espace de stockage isolé', () => {
  it('redirige les écritures sous le préfixe de démo', async () => {
    const { scope } = await loadScopeModule();
    expect(scope.installStorageIsolation()).toBe(true);

    localStorage.setItem(REAL_COLLECTIONS, JSON.stringify(['jean-3-16']));

    expect(localStorage.getItem(REAL_COLLECTIONS)).toBe('["jean-3-16"]');
    expect(localStorage.getItem(`${PREFIX}${REAL_COLLECTIONS}`)).toBe('["jean-3-16"]');
  });

  it('ne lit jamais une valeur réelle laissée par l’application', async () => {
    localStorage.setItem(REAL_COLLECTIONS, '["vraie-donnee"]');
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    expect(localStorage.getItem(REAL_COLLECTIONS)).toBeNull();
  });

  it('laisse les clés de contrôle hors périmètre (sortie de démo possible)', async () => {
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    localStorage.setItem('versyflow:data-mode', 'live');
    expect(localStorage.getItem('versyflow:data-mode')).toBe('live');
    expect(localStorage.getItem(`${PREFIX}versyflow:data-mode`)).toBeNull();
  });

  it('ne supprime que les clés de démo lors d’un clear()', async () => {
    localStorage.setItem(REAL_COLLECTIONS, '["reelle"]');
    localStorage.setItem(REAL_SEARCH, '["recherche-reelle"]');

    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    localStorage.setItem(REAL_COLLECTIONS, '["demo"]');

    localStorage.clear();

    // Les valeurs réelles sont intactes (y compris celle qui porte le même nom).
    expect(localStorage.getItem(`${PREFIX}${REAL_COLLECTIONS}`)).toBeNull();
    expect(rawGet(REAL_COLLECTIONS)).toBe('["reelle"]');
    expect(rawGet(REAL_SEARCH)).toBe('["recherche-reelle"]');
  });

  it('clearDemoStorage() ne touche aucune clé réelle', async () => {
    localStorage.setItem(REAL_COLLECTIONS, '["reelle"]');
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    localStorage.setItem(REAL_COLLECTIONS, '["demo"]');
    localStorage.setItem(REAL_SEARCH, '["demo-search"]');

    const removed = scope.clearDemoStorage();

    expect(removed).toBe(2);
    expect(rawGet(REAL_COLLECTIONS)).toBe('["reelle"]');
    expect(scope.listDemoStorageKeys()).toEqual([]);
  });

  it('désinstaller la redirection rend le stockage natif', async () => {
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    localStorage.setItem(REAL_COLLECTIONS, '["demo"]');
    scope.uninstallStorageIsolation();

    localStorage.setItem(REAL_COLLECTIONS, '["reelle"]');
    expect(localStorage.getItem(REAL_COLLECTIONS)).toBe('["reelle"]');
    expect(localStorage.getItem(`${PREFIX}${REAL_COLLECTIONS}`)).toBe('["demo"]');
  });

  it('n’installe rien en mode live', async () => {
    window.history.replaceState({}, '', '/?data=live');
    const { scope } = await loadScopeModule();
    expect(scope.installStorageIsolation()).toBe(false);

    localStorage.setItem(REAL_COLLECTIONS, '["reelle"]');
    expect(localStorage.getItem(`${PREFIX}${REAL_COLLECTIONS}`)).toBeNull();
  });
});

describe('écritures de la démo', () => {
  it('les repositories mock n’écrivent que dans l’espace de démo', async () => {
    localStorage.setItem(REAL_COLLECTIONS, '["vraie-donnee-utilisateur"]');
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    const { ensureMockSeed } = await import('@/dev/mock/seed');
    const { seedMockFamilyRoom } = await import('@/dev/mock/family-room-seed');
    const seed = ensureMockSeed();
    const familyRoom = seedMockFamilyRoom();

    expect(seed.records).toBeGreaterThan(0);
    expect(familyRoom.challenges).toBeGreaterThan(0);

    // Toutes les écritures sont préfixées…
    expect(scope.listDemoStorageKeys().length).toBeGreaterThan(0);
    // …et la valeur réelle n'a pas bougé.
    expect(rawGet(REAL_COLLECTIONS)).toBe('["vraie-donnee-utilisateur"]');
  });

  it('la graine famille est idempotente (les manipulations de test survivent au reload)', async () => {
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    const { ensureMockSeed } = await import('@/dev/mock/seed');
    const { seedMockFamilyRoom } = await import('@/dev/mock/family-room-seed');
    ensureMockSeed();

    const first = seedMockFamilyRoom();
    const second = seedMockFamilyRoom();

    expect(first.seeded).toBe(true);
    expect(second.seeded).toBe(false);
    expect(second.challenges).toBe(first.challenges);
  });
});

describe('parcours démo : navigation directe, rechargement, sortie', () => {
  it('une écriture d’écran (profil, famille, recherche) ne touche jamais la clé réelle', async () => {
    localStorage.setItem('versyflow:profile:name', 'Nom réel');
    localStorage.setItem('versyflow-family-room', '{"challenges":[]}');

    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    // Ce que font les écrans : des écritures directes + des stores persistés.
    localStorage.setItem('versyflow:profile:name', 'Nom de démo');
    const { useFamilyRoomStore } = await import('@/store/family-room-store');
    useFamilyRoomStore.getState().createChallenge({
      familyId: 'fam_demo',
      title: 'Défi de test',
      kind: 'collectif',
      unit: 'verses',
      passage: 'Psaumes 23',
      target: 5,
      durationDays: 7,
      participants: ['Ami de la Parole'],
    });

    expect(localStorage.getItem('versyflow:profile:name')).toBe('Nom de démo');
    expect(rawGet('versyflow:profile:name')).toBe('Nom réel');
    expect(rawGet('versyflow-family-room')).toBe('{"challenges":[]}');
    expect(localStorage.getItem('versyflow-family-room')).toContain('Défi de test');
  });

  it('recharger l’application retrouve l’état de démo (pas la donnée réelle)', async () => {
    localStorage.setItem('versyflow-profile-storage', '{"state":{"profiles":["reel"]},"version":0}');

    const first = await loadScopeModule();
    first.scope.installStorageIsolation();
    localStorage.setItem('versyflow-profile-storage', '{"state":{"profiles":["demo"]},"version":0}');

    // « Rechargement » : nouveaux modules, redirection réinstallée avant lecture.
    vi.resetModules();
    const second = await import('@/dev/mock/storage-scope');
    second.installStorageIsolation();
    const { useProfileStore } = await import('@/store/profile-store');
    const profiles = useProfileStore.getState().profiles ?? [];
    expect(JSON.stringify(profiles)).toContain('demo');
    expect(rawGet('versyflow-profile-storage')).toContain('reel');
  });

  it('sortir de la démo (mode live) rend les vraies données lisibles', async () => {
    localStorage.setItem('versyflow:collections', '["vraie-collection"]');
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    localStorage.setItem('versyflow:collections', '["collection-demo"]');
    expect(localStorage.getItem('versyflow:collections')).toBe('["collection-demo"]');

    // Sortie de démo = rechargement en mode live : la redirection disparaît.
    Storage.prototype.getItem = NATIVE_GET_ITEM;
    Storage.prototype.setItem = NATIVE_SET_ITEM;
    vi.resetModules();
    const live = await import('@/dev/mode');
    if (live.getDataMode() === 'mock') {
      // Le mode est résolu une fois par chargement : on force ici la même
      // bascule que `exitDemoSession()` + reload.
      live.setDataMode('live');
    }
    expect(live.getDataMode()).toBe('live');
    expect(localStorage.getItem('versyflow:collections')).toBe('["vraie-collection"]');
  });

  it('l’installateur d’isolation est le tout premier import de main.tsx', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync('src/main.tsx', 'utf8');
    const firstImport = source.split('\n').find((line) => line.trim().startsWith('import '));
    expect(firstImport).toContain("@/dev/mock/install-isolation");
  });

  it('isole aussi l’énumération des notes (MmkvStorage.getAllKeys / listVerseNotes)', async () => {
    localStorage.setItem('versyflow:note:gen:1:1', 'Ma vraie note personnelle');

    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    const { saveVerseNote, listVerseNotes } = await import('@/services/verse-note-service');
    await saveVerseNote('psa', 23, 2, 'Note écrite pendant la démo');

    const demoNotes = await listVerseNotes();
    expect(demoNotes.map((n) => n.verseKey)).toContain('psa:23:2');
    expect(demoNotes.map((n) => n.verseKey)).not.toContain('gen:1:1');
    expect(rawGet('versyflow:note:gen:1:1')).toBe('Ma vraie note personnelle');

    // Retour en mode live : la vraie note réapparaît, la note démo reste cachée.
    scope.uninstallStorageIsolation();
    window.history.replaceState({}, '', '/?data=live');
    vi.resetModules();
    const liveNotesModule = await import('@/services/verse-note-service');
    const liveNotes = await liveNotesModule.listVerseNotes();
    expect(liveNotes.map((n) => n.verseKey)).toContain('gen:1:1');
    expect(liveNotes.map((n) => n.verseKey)).not.toContain('psa:23:2');
  });

  it('isole l’arbre sémantique et les tags utilisateur sans ouvrir PowerSync', async () => {
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    const { SemanticService } = await import('@/services/semantic-query-service');
    const service = new SemanticService();

    const index = await service.indexView();
    expect(index.communities.length).toBeGreaterThan(0);

    const saved = await service.saveVerseTag({
      verseKey: 'joh:3:16',
      conceptId: 'cpt-test-gratitude',
      canonicalName: 'Gratitude',
      role: 'PRIMARY',
      locale: 'fr',
    });
    expect(saved.created).toBe(true);

    const chapter = await service.chapterConcepts('joh', 3);
    expect(chapter.conceptIdsByVerse['joh:3:16']).toContain(saved.concept.id);

    const mine = await service.myConcepts(20, 'fr');
    expect(mine.some((entry) => entry.label === 'Gratitude')).toBe(true);
    expect(rawGet('versyflow:semantic:mock:v1')).toBeNull();
  });

  it('marque l’onboarding comme prêt dans la démo sans toucher le drapeau réel', async () => {
    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();
    const { ensureMockSeed } = await import('@/dev/mock/seed');
    ensureMockSeed();

    expect(localStorage.getItem('versyflow:onboarding:completed')).toBe('true');
    expect(rawGet('versyflow:onboarding:completed')).toBeNull();
  });

  it('n’altère jamais les notifications système de l’appareil en mode démo isolé', async () => {
    const scheduleSpy = vi.fn(() => Promise.resolve({ notifications: [] }));
    const cancelSpy = vi.fn(() => Promise.resolve(undefined));
    const requestPermissionsSpy = vi.fn(() => Promise.resolve({ display: 'granted' }));
    vi.doMock('@/lib/platform', () => ({ isNativePlatform: () => true }));
    vi.doMock('@capacitor/local-notifications', () => ({
      LocalNotifications: {
        schedule: scheduleSpy,
        cancel: cancelSpy,
        requestPermissions: requestPermissionsSpy,
        checkPermissions: vi.fn(() => Promise.resolve({ display: 'granted' })),
        getPending: vi.fn(() => Promise.resolve({ notifications: [{ id: 1 }, { id: 102 }] })),
      },
    }));

    const { scope } = await loadScopeModule();
    scope.installStorageIsolation();

    const { NotificationService } = await import('@/services/notification-service');
    const { applyWeeklyPlan, DEFAULT_WEEKLY_PLAN } = await import(
      '@/services/weekly-reminder-plan'
    );

    const service = new NotificationService();
    const daily = await service.scheduleDailyReminders(
      { enabled: true, frequency: 2, time: '08:30' },
      'Rappel démo',
    );
    expect(daily).toHaveLength(2);

    const weeklyTarget = await applyWeeklyPlan(
      {
        ...DEFAULT_WEEKLY_PLAN,
        review: { enabled: true, time: '09:00', days: [2, 4] },
      },
      { review: 'Révision', memorization: 'Mémorisation' },
    );
    expect(weeklyTarget).toBe('web');
    expect(scheduleSpy).not.toHaveBeenCalled();
    expect(cancelSpy).not.toHaveBeenCalled();
    expect(requestPermissionsSpy).not.toHaveBeenCalled();
  });
});
