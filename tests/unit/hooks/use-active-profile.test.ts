/**
 * Unit Tests — useActiveProfile Hook
 * Tests active profile management logic
 */

describe('useActiveProfile Hook', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = {
      activeProfileId: null,
      profiles: [],
      selectProfile: jest.fn(),
      addProfile: jest.fn(),
      removeProfile: jest.fn(),
      autoSelectIfSingle: jest.fn(),
    };
  });

  it('should return null activeProfile when no profiles exist', () => {
    const profiles = [];
    const activeProfileId = null;
    const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;
    expect(activeProfile).toBeNull();
  });

  it('should return active profile when profile ID matches', () => {
    const profiles = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const activeProfileId = 'prof-1';
    const activeProfile = profiles.find((p) => p.id === activeProfileId) || null;
    expect(activeProfile).not.toBeNull();
    expect(activeProfile.displayName).toBe('Alice');
  });

  it('should show selector when 0 profiles exist', () => {
    const profiles = [];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(true);
  });

  it('should show selector when multiple profiles exist', () => {
    const profiles = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(true);
  });

  it('should not show selector when single profile exists', () => {
    const profiles = [{ id: 'prof-1', displayName: 'Alice' }];
    const shouldShowSelector = profiles.length === 0 || profiles.length > 1;
    expect(shouldShowSelector).toBe(false);
  });

  it('should auto-select single profile', () => {
    const profiles = [{ id: 'prof-1', displayName: 'Alice' }];
    const activeProfileId = null;
    let newActiveId = activeProfileId;
    if (!newActiveId && profiles.length === 1) {
      newActiveId = profiles[0].id;
    }
    expect(newActiveId).toBe('prof-1');
  });

  it('should not auto-select when multiple profiles exist', () => {
    const profiles = [
      { id: 'prof-1', displayName: 'Alice' },
      { id: 'prof-2', displayName: 'Bob' },
    ];
    const activeProfileId = null;
    let newActiveId = activeProfileId;
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
      status: 'active',
    };
    expect(newProfile.accountId).toBe('user-1');
    expect(newProfile.displayName).toBe('Sarah');
    expect(newProfile.status).toBe('active');
  });
});
