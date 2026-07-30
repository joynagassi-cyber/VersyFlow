/**
 * E2E Test: Complete Review Flow
 * Tests: Onboarding → Select Verse → Memorize → Review → Verify Persistence
 */

describe('Review Persistence Flow', () => {
  beforeEach(async () => {
    // Initialize device and app
    await device.reloadReactNative();
  });

  it('should persist review logs after session completion', async () => {
    // Navigate to review queue
    await element(by.id('reviewQueueScreen')).appear();

    // Select a review item
    await element(by.text('Jean 3:16')).tap();

    // Wait for session screen
    await element(by.id('reviewSessionScreen')).appear();

    // Simulate revealing words and selecting rating
    await element(by.id('ratingButtonGood')).tap();

    // Wait for confirmation
    await element(by.id('reviewConfirmation')).appear();

    // Verify review history is accessible
    await element(by.text('Historique')).tap();
    await element(by.id('historyScreen')).appear();

    // Verify at least one log entry exists
    const logCount = await element(by.text('Review log count')).count();
    expect(logCount).toBeGreaterThan(0);
  });

  it('should store review data with full context', async () => {
    // Perform review action
    await element(by.id('ratingGood')).tap();

    // Verify storage contains review entry
    const storageKey = await device.getStorageItem('versyflow:reviewlogs:recordId');
    expect(storageKey).not.toBeNull();
    expect(JSON.parse(storageKey)).toBeTruthy();
  });
});
