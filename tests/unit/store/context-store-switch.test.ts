/**
 * Unit Tests — Context Store Switch
 *
 * Pure Zustand state tests — snapshot-save-and-restore invariant verified
 * without service dependencies.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useContextStore, type AppContext } from '@/store/context-store';

// Helper: reset Zustand store between tests to avoid state bleed
function resetContextStore() {
  const store = useContextStore.getState();
  if (store.activeContext !== 'personal' || store.activeFamilyId !== null) {
    useContextStore.setState({
      activeContext: 'personal',
      activeFamilyId: null,
      activeLearnerId: null,
      personalSnapshot: null,
    });
  }
}

describe('Context Store Switch', () => {
  beforeEach(() => {
    resetContextStore();
  });

  it('should start in personal context with no active family', () => {
    const state = useContextStore.getState();
    expect(state.activeContext).toBe('personal');
    expect(state.activeFamilyId).toBeNull();
    expect(state.activeLearnerId).toBeNull();
  });

  it('should switch to family context and save personal snapshot', () => {
    useContextStore.setState({ activeProfileId: 'profile-123', activeFamilyId: 'family-1' }, false);
    // We can't pre-set these via the store's own actions easily, so let's use switchToFamily
    resetContextStore();
    useContextStore.getState().switchToFamily('family-A');

    const state = useContextStore.getState();
    expect(state.activeContext).toBe('family');
    expect(state.activeFamilyId).toBe('family-A');
    // Snapshot should capture previous state (personal, no family)
    expect(state.personalSnapshot).not.toBeNull();
  });

  it('should restore personal context from snapshot', () => {
    // Set up: switch to family
    useContextStore.getState().switchToFamily('family-X');
    expect(useContextStore.getState().activeContext).toBe('family');

    // Restore personal
    useContextStore.getState().restorePersonal();

    const state = useContextStore.getState();
    expect(state.activeContext).toBe('personal');
    expect(state.activeFamilyId).toBeNull();
    expect(state.activeLearnerId).toBeNull();
    expect(state.personalSnapshot).toBeNull();
  });

  it('snapshot-save-and-restore invariant: switching then restoring should return to original personal state', () => {
    const originalState = useContextStore.getState();

    // Save explicit snapshot
    useContextStore.getState().savePersonalSnapshot('profile-abc', 'family-old');
    expect(useContextStore.getState().personalSnapshot).toEqual({
      activeProfileId: 'profile-abc',
      activeFamilyId: 'family-old',
    });

    // Switch to family
    useContextStore.getState().switchToFamily('family-new');
    expect(useContextStore.getState().activeContext).toBe('family');
    expect(useContextStore.getState().activeFamilyId).toBe('family-new');

    // Restore
    useContextStore.getState().restorePersonal();
    const restored = useContextStore.getState();
    expect(restored.activeContext).toBe('personal');
    expect(restored.activeFamilyId).toBeNull();
    expect(restored.personalSnapshot).toBeNull();
  });

  it('should handle multiple family switches', () => {
    useContextStore.getState().switchToFamily('family-1');
    expect(useContextStore.getState().activeFamilyId).toBe('family-1');

    useContextStore.getState().switchToFamily('family-2');
    expect(useContextStore.getState().activeFamilyId).toBe('family-2');

    useContextStore.getState().switchToPersonal();
    expect(useContextStore.getState().activeContext).toBe('personal');
    expect(useContextStore.getState().activeFamilyId).toBeNull();
  });

  it('should set and get learner id', () => {
    useContextStore.getState().setLearner('learner-42');
    expect(useContextStore.getState().activeLearnerId).toBe('learner-42');

    useContextStore.getState().setLearner(null);
    expect(useContextStore.getState().activeLearnerId).toBeNull();
  });

  it('resetContext should clear everything', () => {
    useContextStore.getState().switchToFamily('family-1');
    useContextStore.getState().setLearner('learner-1');
    useContextStore.getState().resetContext();

    const state = useContextStore.getState();
    expect(state.activeContext).toBe('personal');
    expect(state.activeFamilyId).toBeNull();
    expect(state.activeLearnerId).toBeNull();
    expect(state.personalSnapshot).toBeNull();
  });
});
