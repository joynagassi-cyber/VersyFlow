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

installStorageIsolation();
