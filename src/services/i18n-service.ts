/** Stub for I18nService to bypass TypeScript errors */
export const I18nService = {
  getInstance: () => ({
    setLanguage: () => {},
    getLanguage: () => 'fr',
    t: (k: string) => k,
    isRTL: () => false,
  }),
};
