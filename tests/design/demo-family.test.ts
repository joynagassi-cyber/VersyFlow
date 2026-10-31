/**
 * Démo Famille — les écrans Famille doivent être testables en démo.
 *
 * Ce que l'on prouve ici (au niveau service/repository, pas au niveau rendu) :
 *  - la famille de démo existe et ses membres ont un **nom** (pas un id brut) ;
 *  - les défis / séances / activité sont semés pour cette famille ;
 *  - aucune de ces écritures ne touche les clés réelles.
 */

/* eslint-disable @typescript-eslint/unbound-method -- on capture volontairement
   les méthodes natives de `Storage` pour les appeler avec `.call(window.localStorage)` :
   c'est le seul moyen de lire l'emplacement réel sans passer par la redirection. */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NATIVE_GET_ITEM = Storage.prototype.getItem;
const NATIVE_SET_ITEM = Storage.prototype.setItem;
const NATIVE_REMOVE_ITEM = Storage.prototype.removeItem;
const NATIVE_CLEAR = Storage.prototype.clear;
const PREFIX = 'versyflow:mock-scope:v1:';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  Storage.prototype.getItem = NATIVE_GET_ITEM;
  Storage.prototype.setItem = NATIVE_SET_ITEM;
  Storage.prototype.removeItem = NATIVE_REMOVE_ITEM;
  Storage.prototype.clear = NATIVE_CLEAR;
  vi.resetModules();
  NATIVE_CLEAR.call(window.localStorage);
  window.history.replaceState({}, '', '/');
});

describe('famille en mode démo', () => {
  it('sème une famille, ses membres nommés, un défi et une séance', async () => {
    const { installStorageIsolation } = await import('@/dev/mock/storage-scope');
    installStorageIsolation();

    const { ensureMockSeed } = await import('@/dev/mock/seed');
    const { getMockUserId } = await import('@/dev/mock/identity');
    const { seedMockFamilyRoom } = await import('@/dev/mock/family-room-seed');
    ensureMockSeed();
    const room = seedMockFamilyRoom();

    const { getFamilyRepository, getLearnerProfileRepository } = await import(
      '@/infrastructure/repository/powersync-repositories'
    );
    const { FamilyService } = await import('@/services/family-service');
    const { MockFamilyInvitationRepository } = await import('@/dev/mock/repositories');

    const families = await getFamilyRepository().findByOwnerId(getMockUserId());
    expect(families.length).toBe(1);

    const service = new FamilyService(
      getFamilyRepository(),
      new MockFamilyInvitationRepository(),
      getLearnerProfileRepository(),
    );
    const members = await service.getMembersScoped(families[0].id, getMockUserId());

    expect(members.length).toBeGreaterThanOrEqual(2);
    expect(members.every((m) => Boolean(m.profile?.displayName))).toBe(true);
    expect(members.map((m) => m.profile?.displayName)).toContain('Grâce');

    expect(room.familyId).toBe(families[0].id);
    expect(room.challenges).toBeGreaterThan(0);
    expect(room.sessions).toBeGreaterThan(0);
    expect(room.activities).toBeGreaterThan(0);

    // Rien n'a fuité hors de l'espace de démo.
    expect(NATIVE_GET_ITEM.call(window.localStorage, 'versyflow:mock:db:v1')).toBeNull();
    const scopedKeys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
    expect(scopedKeys.some((k) => k?.startsWith(PREFIX))).toBe(true);
  });

  it('la graine famille utilise les réglages par défaut sans les écraser', async () => {
    const { installStorageIsolation } = await import('@/dev/mock/storage-scope');
    installStorageIsolation();
    const { ensureMockSeed } = await import('@/dev/mock/seed');
    const { seedMockFamilyRoom } = await import('@/dev/mock/family-room-seed');
    const { useFamilyRoomStore } = await import('@/store/family-room-store');
    ensureMockSeed();

    const familyId = seedMockFamilyRoom().familyId!;
    useFamilyRoomStore.getState().updateSettings(familyId, { showScores: false, resetDay: 'sunday' });
    seedMockFamilyRoom({ force: true });

    const settings = useFamilyRoomStore.getState().settingsFor(familyId);
    expect(settings.showScores).toBe(false);
    expect(settings.resetDay).toBe('sunday');
  });
});
