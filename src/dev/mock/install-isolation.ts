/**
 * Installateur de l'isolation de stockage — **effet de bord volontaire**.
 *
 * Ce module doit être le **tout premier import** de `src/main.tsx` : la
 * redirection des clés `localStorage` doit être en place avant l'évaluation
 * des modules qui lisent le stockage à l'import (stores Zustand persistés,
 * i18n, préférences d'apparence). Sinon, la première hydratation lirait les
 * vraies préférences de l'utilisateur.
 *
 * Hors mode mock, `installStorageIsolation()` ne fait rien : le stockage natif
 * reste intact en mode live.
 */

import { installStorageIsolation } from './storage-scope';
import { isMockMode } from '@/dev/mode';

if (typeof window !== 'undefined' && isMockMode() && !installStorageIsolation()) {
  // Fail closed: continuing would hydrate stores from real, unscoped keys.
  const root = document.getElementById('root');
  if (root) root.textContent = 'Démo indisponible : isolation du stockage impossible. Aucune donnée n’a été chargée par l’application.';
  throw new Error('Isolation du stockage de démo indisponible');
} else if (!isMockMode()) {
  installStorageIsolation();
}
