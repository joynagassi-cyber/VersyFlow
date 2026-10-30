/**
 * preview-session — ce qui distingue un cadre de prévisualisation d'une vraie
 * session utilisateur.
 *
 * Trois responsabilités, et rien d'autre :
 *  1. **lire le rôle** de la frame (`mobile` / `desktop` / `tablet`) ;
 *  2. **semer un jeu de démonstration déterministe** dans le stockage — qui est
 *     déjà en mémoire grâce à `preview-frame.html`, donc jetable ;
 *  3. **relier les commandes du laboratoire** à cette frame (navigation, thème,
 *     rechargement) par `postMessage`.
 *
 * Ce module n'est importé que sous `import.meta.env.DEV` depuis `src/main.tsx` :
 * il n'existe pas dans le bundle de production (`npm run build` le prouve).
 *
 * Ce qu'il ne fait volontairement pas :
 *  - aucune requête réseau, aucune écriture sur un compte ;
 *  - aucun partage de session entre les deux frames : chacune a son stockage,
 *    donc une saisie dans la frame mobile n'apparaît jamais dans la frame
 *    bureau. Le laboratoire ne synchronise que la **route** et le **thème**.
 */

import { FAMILY_SWATCHES } from '@/theme/family-palette';

export type PreviewRole = 'mobile' | 'desktop' | 'tablet';

declare global {
  interface Window {
    __VF_PREVIEW_ROLE__?: string;
    __VF_PREVIEW_STORAGE_ISOLATED__?: boolean;
  }
}

/** Rôles acceptés par `preview-frame.html`. */
const ROLES: readonly PreviewRole[] = ['mobile', 'desktop', 'tablet'];

/** Identifiants du jeu de démonstration — préfixés pour ne jamais croiser un vrai identifiant. */
export const PREVIEW_ACCOUNT_ID = 'preview-compte';
export const PREVIEW_PROFILE_ID = 'preview-profil-lea';
export const PREVIEW_FAMILY_ID = 'preview-famille-etoile';

const DAY = 86_400_000;
/** Date fixe : le jeu de démonstration ne doit pas dépendre du jour d'exécution. */
const FIXED_CREATED_AT = Date.UTC(2026, 0, 5, 9, 0, 0);

/** Rôle de la frame, ou `null` si l'on est dans une frame normale. */
export function previewRole(): PreviewRole | null {
  if (typeof window === 'undefined') return null;
  const role = window.__VF_PREVIEW_ROLE__;
  return typeof role === 'string' && (ROLES as readonly string[]).includes(role)
    ? (role as PreviewRole)
    : null;
}

/** Vrai uniquement en développement *et* dans un cadre de prévisualisation. */
export function isPreviewRequest(): boolean {
  return import.meta.env.DEV && previewRole() !== null;
}

/** Vrai quand `preview-frame.html` a bien isolé le stockage. */
export function previewStorageIsolated(): boolean {
  return typeof window !== 'undefined' && window.__VF_PREVIEW_STORAGE_ISOLATED__ === true;
}

/**
 * Jeu de démonstration, écrit avant l'hydratation des stores (sinon les écrans
 * démarreraient sur l'onboarding ou sans profil).
 *
 * Chaque valeur correspond à une clé **réellement lue** par le produit :
 *  - `versyflow-settings-storage` → `settings-store`
 *  - `versyflow:onboarding:completed` → `settings-store` (lecture au boot)
 *  - `versyflow:appearance:settings` → `appearance-store`
 *  - `versyflow-profile-storage` → `profile-store` (zustand `persist`)
 *  - `versyflow-family-sync-storage` → `family-sync-store` (zustand `persist`)
 *  - `versyflow-family-room` → `family-room-store` (zustand `persist`)
 */
export function seedPreviewStorage(): void {
  if (typeof localStorage === 'undefined') return;
  const put = (key: string, value: string) => localStorage.setItem(key, value);

  put('versyflow:onboarding:completed', 'true');
  put('versyflow:ui:language', 'fr');
  put('versyflow:bible:translation', 'lsg');
  put(
    'versyflow-settings-storage',
    JSON.stringify({
      uiLanguage: 'fr',
      bibleTranslation: 'lsg',
      bibleVersionType: 'classical',
      onboardingCompleted: true,
    }),
  );

  put(
    'versyflow:appearance:settings',
    JSON.stringify({
      themeMode: 'light',
      accent: 'quantum-rose',
      presetId: 'quantum-rose',
      backgroundType: 'none',
      gradientId: null,
      uiFontId: 'system',
      colorThemeId: null,
      fontSize: 16,
      showVerseNumbers: true,
      reminderFrequency: 1,
      reminderEnabled: false,
      sessionGoal: 3,
      focusMode: false,
      reducedTransparency: false,
      highContrast: false,
      reminderTime: '09:00',
      bibleFontFamily: 'source-serif-4',
      bibleFontSize: 19,
      bibleLineHeight: 1.75,
      bibleLetterSpacing: 0.01,
      bibleLineLength: 42,
    }),
  );

  put(
    'versyflow-profile-storage',
    JSON.stringify({
      state: {
        activeProfileId: PREVIEW_PROFILE_ID,
        profiles: [
          {
            id: PREVIEW_PROFILE_ID,
            accountId: PREVIEW_ACCOUNT_ID,
            displayName: 'Léa',
            slogan: 'Gardienne du Psaume 23',
            createdAt: FIXED_CREATED_AT,
            updatedAt: FIXED_CREATED_AT,
            status: 'active',
          },
        ],
      },
      version: 0,
    }),
  );

  put(
    'versyflow-family-sync-storage',
    JSON.stringify({
      state: {
        activeFamilyId: PREVIEW_FAMILY_ID,
        families: [
          {
            id: PREVIEW_FAMILY_ID,
            ownerId: PREVIEW_ACCOUNT_ID,
            name: 'Famille Étoile',
            color: FAMILY_SWATCHES[0].value,
            icon: '⭐',
            createdAt: FIXED_CREATED_AT,
          },
        ],
        memberships: [],
        lastSyncAt: null,
        syncError: null,
      },
      version: 0,
    }),
  );

  // Défi + fil d'activité : des dates **relatives** au démarrage, mais une
  // structure fixe — le scénario est reproductible, seule l'horloge bouge.
  const now = Date.now();
  put(
    'versyflow-family-room',
    JSON.stringify({
      state: {
        challenges: [
          {
            id: 'preview-defi-psaume-23',
            familyId: PREVIEW_FAMILY_ID,
            title: 'Psaume 23 en 14 jours',
            kind: 'passage',
            unit: 'verses',
            passage: 'Psaumes 23:1-6',
            target: 6,
            durationDays: 14,
            createdAt: now - 5 * DAY,
            participants: ['Léa', 'Marc'],
            progress: { Léa: 4, Marc: 2 },
            status: 'active',
          },
        ],
        sessions: [],
        activities: [
          {
            id: 'preview-activite-1',
            familyId: PREVIEW_FAMILY_ID,
            actor: 'Léa',
            kind: 'challenge-started',
            target: 'Psaume 23 en 14 jours',
            at: now - 5 * DAY,
            reactions: {},
          },
          {
            id: 'preview-activite-2',
            familyId: PREVIEW_FAMILY_ID,
            actor: 'Marc',
            kind: 'level-up',
            target: 'Niveau 3',
            at: now - 2 * DAY,
            reactions: {},
          },
        ],
        settings: {},
      },
      version: 0,
    }),
  );
}

/**
 * Chemin initial demandé par le laboratoire.
 *
 * On réécrit l'URL **avant** le montage du routeur : `BrowserRouter` lit
 * `window.location` à son premier rendu, donc l'application démarre directement
 * sur l'écran demandé, sans redirection visible.
 */
export function applyInitialPath(): void {
  if (typeof window === 'undefined') return;
  const requested = new URLSearchParams(window.location.search).get('screen');
  if (!requested || !requested.startsWith('/')) return;
  window.history.replaceState(null, '', requested);
}

export interface PreviewMessage {
  type: string;
  path?: string;
  appearance?: Record<string, unknown>;
}

function postToParent(message: Record<string, unknown>): void {
  try {
    window.parent?.postMessage(message, window.location.origin);
  } catch {
    /* la frame peut être détachée (rechargement) : rien à signaler */
  }
}

/**
 * Navigation sans dépendre du routeur : `pushState` + `popstate` est
 * exactement ce que `BrowserRouter` écoute, donc l'état React suit.
 */
export function previewNavigate(path: string): void {
  if (!path.startsWith('/')) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Applique l'apparence reçue du laboratoire. Les stores n'étant pas persistés
 * vers le vrai stockage (mémoire), cette écriture ne quitte pas la frame.
 */
export async function applyPreviewAppearance(
  appearance: Record<string, unknown>,
): Promise<void> {
  const { useAppearanceStore } = await import('@/store/appearance-store');
  useAppearanceStore.setState(appearance as never);
}

/**
 * Relie la frame au laboratoire et annonce son état. Renvoie la fonction de
 * nettoyage (utile si le laboratoire remonte la frame).
 */
export function attachPreviewBridge(): () => void {
  const role = previewRole();
  if (!role) return () => undefined;

  const onMessage = (event: MessageEvent<PreviewMessage>) => {
    // Seul le parent direct pilote la frame.
    if (event.source !== window.parent) return;
    const data = event.data;
    if (!data || typeof data.type !== 'string') return;

    switch (data.type) {
      case 'vf:preview:navigate':
        if (data.path) previewNavigate(data.path);
        break;
      case 'vf:preview:appearance':
        if (data.appearance) void applyPreviewAppearance(data.appearance);
        break;
      case 'vf:preview:reload':
        window.location.reload();
        break;
      default:
        break;
    }
  };

  const announceRoute = () =>
    postToParent({ type: 'vf:preview:route', role, path: window.location.pathname });

  window.addEventListener('message', onMessage);
  window.addEventListener('popstate', announceRoute);
  window.addEventListener('pageshow', announceRoute);

  postToParent({
    type: 'vf:preview:ready',
    role,
    path: window.location.pathname,
    isolated: previewStorageIsolated(),
  });

  return () => {
    window.removeEventListener('message', onMessage);
    window.removeEventListener('popstate', announceRoute);
    window.removeEventListener('pageshow', announceRoute);
  };
}
