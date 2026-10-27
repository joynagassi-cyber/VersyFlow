// stitch --prepare script: mark onboarding completed before capture
localStorage.setItem(
  'versyflow-settings-storage',
  JSON.stringify({
    uiLanguage: 'fr',
    bibleTranslation: 'lsg',
    onboardingCompleted: true,
  }),
);
window.__stitchWaitFor('[data-ionic-page-url], ion-header, main', 5000);
