import type { NavigateFunction } from 'react-router-dom';

/** A deep link has no in-app history: return to a safe app destination. */
export function goBackSafely(navigate: NavigateFunction, fallback = '/tabs/home'): void {
  const index = typeof window === 'undefined' ? 0 : window.history.state?.idx;
  if (typeof index === 'number' && index > 0) navigate(-1);
  else navigate(fallback, { replace: true });
}
