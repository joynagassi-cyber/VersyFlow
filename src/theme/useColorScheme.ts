/**
 * useColorScheme Hook — Web-compatible dark mode detection
 */

import { useState, useEffect } from 'react';

export function useColorScheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return document.documentElement.getAttribute('data-theme') === 'dark';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isDark ? 'dark' : 'light';
}

export default useColorScheme;
