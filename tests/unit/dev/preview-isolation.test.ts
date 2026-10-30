/**
 * Prévisualisation — ce que l'isolation promet, vérifié en jsdom.
 *
 * Trois propriétés, celles qui protègent réellement un compte :
 *  1. le jeu de démonstration est **déterministe** et n'utilise que des clés
 *     que le produit lit vraiment ;
 *  2. le remplacement de `localStorage` par une mémoire est **vérifiable** :
 *     une écriture dans la copie ne touche pas l'original ;
 *  3. la route du laboratoire est conditionnée à `import.meta.env.DEV`.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PREVIEW_ACCOUNT_ID,
  PREVIEW_FAMILY_ID,
  PREVIEW_PROFILE_ID,
  previewRole,
  seedPreviewStorage,
} from '@/dev/preview-session';

const root = join(__dirname, '../../..');

describe('jeu de démonstration', () => {
  it('écrit les clés réellement lues par les stores', () => {
    localStorage.clear();
    seedPreviewStorage();

    const settings = JSON.parse(localStorage.getItem('versyflow-settings-storage') ?? '{}') as {
      onboardingCompleted?: boolean;
      uiLanguage?: string;
    };
    expect(settings.onboardingCompleted).toBe(true);
    expect(settings.uiLanguage).toBe('fr');
    expect(localStorage.getItem('versyflow:onboarding:completed')).toBe('true');

    const profiles = JSON.parse(localStorage.getItem('versyflow-profile-storage') ?? '{}') as {
      state?: { activeProfileId?: string; profiles?: { id: string; displayName: string }[] };
    };
    expect(profiles.state?.activeProfileId).toBe(PREVIEW_PROFILE_ID);
    expect(profiles.state?.profiles?.[0]?.displayName).toBe('Léa');

    const family = JSON.parse(localStorage.getItem('versyflow-family-sync-storage') ?? '{}') as {
      state?: { activeFamilyId?: string; families?: { name: string }[] };
    };
    expect(family.state?.activeFamilyId).toBe(PREVIEW_FAMILY_ID);
    expect(family.state?.families?.[0]?.name).toBe('Famille Étoile');
  });

  it('ne contient aucun identifiant de compte réel', () => {
    localStorage.clear();
    seedPreviewStorage();
    expect(PREVIEW_ACCOUNT_ID.startsWith('preview-')).toBe(true);
    expect(PREVIEW_PROFILE_ID.startsWith('preview-')).toBe(true);
    // Une session authentifiée est explicitement absente : le laboratoire ne
    // doit jamais réutiliser le jeton d'un utilisateur.
    expect(localStorage.getItem('versyflow-auth-storage')).toBeNull();
  });

  it('produit le même état deux fois de suite (hors horodatage relatif)', () => {
    localStorage.clear();
    seedPreviewStorage();
    const first = localStorage.getItem('versyflow-profile-storage');
    const firstFamily = localStorage.getItem('versyflow-family-sync-storage');

    localStorage.clear();
    seedPreviewStorage();
    expect(localStorage.getItem('versyflow-profile-storage')).toBe(first);
    expect(localStorage.getItem('versyflow-family-sync-storage')).toBe(firstFamily);
  });
});

describe('isolation du stockage', () => {
  it('une copie en mémoire ne touche pas le localStorage réel', () => {
    const real = window.localStorage;
    const memory = new Map<string, string>();
    const isolated: Storage = {
      get length() {
        return memory.size;
      },
      clear: () => memory.clear(),
      getItem: (key: string) => memory.get(key) ?? null,
      key: (index: number) => [...memory.keys()][index] ?? null,
      removeItem: (key: string) => void memory.delete(key),
      setItem: (key: string, value: string) => void memory.set(key, value),
    };

    Object.defineProperty(window, 'localStorage', { configurable: true, value: isolated });
    try {
      // Clé dédiée : on ne teste pas un résidu laissé par un autre test.
      window.localStorage.setItem('__vf_isolation_probe__', 'ecrit-dans-la-copie');
      expect(window.localStorage.getItem('__vf_isolation_probe__')).toBe('ecrit-dans-la-copie');
      // Le vrai stockage n'a rien reçu.
      expect(real.getItem('__vf_isolation_probe__')).toBeNull();
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: real });
    }
  });

  it('refuse un rôle inconnu', () => {
    expect(previewRole()).toBeNull();
    window.__VF_PREVIEW_ROLE__ = 'mobile';
    expect(previewRole()).toBe('mobile');
    window.__VF_PREVIEW_ROLE__ = 'autre-chose';
    expect(previewRole()).toBeNull();
    delete window.__VF_PREVIEW_ROLE__;
  });
});

describe('isolation de production', () => {
  it('la route du laboratoire est gardée par import.meta.env.DEV', () => {
    const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8');
    const routeIndex = main.indexOf('<Route path="/__dev/responsive-preview"');
    expect(routeIndex).toBeGreaterThan(-1);
    const guard = main.lastIndexOf('import.meta.env.DEV && ResponsivePreview', routeIndex);
    expect(guard).toBeGreaterThan(-1);
    expect(routeIndex - guard).toBeLessThan(200);
  });

  it('la page hôte des iframes n’est pas une entrée de build', () => {
    const vite = readFileSync(join(root, 'vite.config.ts'), 'utf8');
    expect(vite).not.toMatch(/preview-frame\.html/);
  });

  it('le raccourci vers le laboratoire est lui aussi gardé par import.meta.env.DEV', () => {
    const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8');
    // Import paresseux dans une branche morte en production…
    expect(main).toMatch(
      /const DevLabShortcut = import\.meta\.env\.DEV\s*\?\s*lazy\(\(\) => import\('\.\.\/src\/dev\/lab-shortcut'\)\)\s*:\s*null/,
    );
    // …et rendu sous la même garde.
    expect(main).toMatch(/import\.meta\.env\.DEV && DevLabShortcut && <DevLabShortcut \/>/);
    // Garde utile seulement si le composant pointe bien vers le laboratoire.
    const shortcut = readFileSync(join(root, 'src', 'dev', 'lab-shortcut.tsx'), 'utf8');
    expect(shortcut).toMatch(/to="\/__dev\/responsive-preview"/);
  });
});
