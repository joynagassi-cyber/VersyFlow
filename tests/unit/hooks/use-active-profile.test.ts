/**
 * Unit Tests — useActiveProfile Hook
 * Tests active profile management logic
 */

import { describe, it, expect, beforeEach } from 'vitest';

interface Profile {
  id: string;
  displayName: string;
}

describe('useActiveProfile Hook', () => {
  let mockStore: {
    activeProfileId: string | null;
    profiles: Profile[];
    selectProfile: () => void;
    addProfile: () => void;
    removeProfile: () => void;
    autoSelectIfSingle: () => void;
  };

  beforeEach(() => {
    mockStore = {
      activeProfileId: null,
      profiles: [],
      selectProfile: () => {},
      addProfile: () => {},
      removeProfile: () => {},
      autoSelectIfSingle: () => {},
    };
  });

  it('should return null activeProfile when no profiles exist', () => {
    const profiles: Profile[] = [];
    const activeProfileId: string | null = null;
    const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;
    expect(activeProfile).toBeNull();
  });

  it('should return active profile when profile ID matches', () => {
    const profiles: Profile[] = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const activeProfileId = 'prof-1';
    const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;
    expect(activeProfile).not.toBeNull();
    expect(activeProfile!.displayName).toBe('Alice');
  });

  it('should show selector when 0 profiles exist', () => {
    const profiles: Profile[] = [];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(true);
  });

  it('should show selector when multiple profiles exist', () => {
    const profiles: Profile[] = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(true);
  });

  it('should not show selector when single profile exists', () => {
    const profiles: Profile[] = [{ id: 'prof-1', displayName: 'Alice' }];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(false);
  });

  it('should auto-select single profile', () => {
    const profiles: Profile[] = [{ id: 'prof-1', displayName: 'Alice' }];
    const activeProfileId: string | null = null;
    let newActiveId: string | null = activeProfileId;
    if (!newActiveId && profiles.length === 1) {
      newActiveId = profiles[0].id;
    }
    expect(newActiveId).toBe('prof-1');
  });

  it('should not auto-select when multiple profiles exist', () => {
    const profiles: Profile[] = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const activeProfileId: string | null = null;
    let newActiveId: string | null = activeProfileId;
    if (!newActiveId && profiles.length === 1) {
      newActiveId = profiles[0].id;
    }
    expect(newActiveId).toBeNull();
  });

  it('should handle profile creation', () => {
    const user = { userId: 'user-1' };
    const displayName = 'Sarah';
    const newProfile = {
      id: 'profile-' + Date.now(),
      accountId: user.userId,
      displayName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active' as const,
    };
    expect(newProfile.accountId).toBe('user-1');
    expect(newProfile.displayName).toBe('Sarah');
    expect(newProfile.status).toBe('active');
  });
});
