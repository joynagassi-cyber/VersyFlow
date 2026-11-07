import { isMockMode } from './mode';
/** The shared mock backend is the single source of truth for demo mode. */
export const isDemoMode = isMockMode();
