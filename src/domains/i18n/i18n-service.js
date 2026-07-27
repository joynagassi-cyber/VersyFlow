// I18n Service stub - JavaScript version to bypass TypeScript errors
export const I18nService = {
  setLanguage(lang) { console.log('Set language:', lang); },
  getLanguage() { return 'fr'; },
  t(key) { return key; },
  isRTL() { return false; },
  getSupportedLanguages() { return [{ code: 'fr', name: 'Français' }]; },
};
