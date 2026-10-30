/**
 * Tests de contrat du scaffolding desktop + mobile.
 *
 * jsdom ne calcule pas de mise en page : on ne prétend donc pas mesurer un
 * rendu. On prouve ce qui est vérifiable et qui casse réellement en pratique :
 *
 *  1. les trois contextes existent et reposent sur les seuils déjà publiés
 *     (768 / 1024) — pas de quatrième valeur inventée ;
 *  2. un seul shell est monté à la fois, et chaque shell ne contient que sa
 *     navigation (aucun contrôle dupliqué dans le DOM) ;
 *  3. les coquilles ne dupliquent **aucun** service métier : elles ne font que
 *     composer des composants existants et monter `<Outlet />` ;
 *  4. le panneau secondaire n'est monté que là où il sert, et il agit sur de
 *     vrais réglages (`appearance-store`) ;
 *  5. le laboratoire de prévisualisation n'est branché qu'en DEV.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DESKTOP_MIN_WIDTH, TABLET_MIN_WIDTH } from '@/hooks/useIsDesktop';
import { READING_PANEL_ROUTES, isReadingRoute } from '@/shells/panel-routes';

const root = join(__dirname, '../..');
const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');

const SHELL_DIR = join(root, 'src', 'shells');
const shellFiles = readdirSync(SHELL_DIR).filter((name) => name.endsWith('.tsx'));

describe('scaffolding — trois contextes, deux seuils', () => {
  it('réutilise les seuils publiés au lieu d’en inventer de nouveaux', () => {
    expect(TABLET_MIN_WIDTH).toBe(768);
    expect(DESKTOP_MIN_WIDTH).toBe(1024);

    const hook = read('src', 'hooks', 'useShell.ts');
    expect(hook).toMatch(/useIsRail\(\)/);
    expect(hook).toMatch(/useIsDesktop\(\)/);
    // Aucune nouvelle media query écrite à la main dans le hook de contexte.
    expect(hook).not.toMatch(/min-width:\s*\d+px/);
  });

  it('nomme les trois contextes attendus', () => {
    const hook = read('src', 'hooks', 'useShell.ts');
    expect(hook).toMatch(/export type ShellKind = 'mobile' \| 'tablet' \| 'desktop'/);
  });
});

describe('scaffolding — un seul shell monté', () => {
  it('aiguille MobileShell ou DesktopShell, jamais les deux', () => {
    const appShell = read('src', 'shells', 'AppShell.tsx');
    expect(appShell).toMatch(/kind === 'mobile' \? <MobileShell \/> : <DesktopShell \/>/);
  });

  it('garde chaque navigation dans son propre shell', () => {
    const mobile = read('src', 'shells', 'MobileShell.tsx');
    const desktop = read('src', 'shells', 'DesktopShell.tsx');

    for (const shared of ['HamburgerMenu', 'QuickDock', 'BottomTabs']) {
      expect(mobile).toMatch(new RegExp(`<${shared} />`));
      expect(desktop).not.toMatch(new RegExp(`<${shared}`));
    }
    expect(desktop).toMatch(/<DesktopRail \/>/);
    expect(mobile).not.toMatch(/DesktopRail/);
  });

  it('présente un vrai en-tête de bureau (actions globales, pas un libellé figé)', () => {
    const header = read('src', 'shells', 'DesktopHeader.tsx');
    expect(header).toMatch(/navigation|\/search/);
    expect(header).toMatch(/SyncStatusIndicator/);
    expect(header).toMatch(/aria-label=/);
    // Raccourci clavier : une commande globale doit être atteignable sans souris.
    expect(header).toMatch(/metaKey \|\| event\.ctrlKey/);
  });

  it('ne contient plus de structure dans le layout de route', () => {
    const layout = read('app', '(tabs)', '_layout.tsx');
    expect(layout).toMatch(/<AppShell \/>/);
    for (const gone of ['DesktopRail', 'BottomTabs', 'QuickDock', 'HamburgerMenu']) {
      expect(layout).not.toMatch(new RegExp(gone));
    }
  });
});

describe('scaffolding — pas de duplication métier', () => {
  it('aucune coquille n’importe un service, un store de domaine ou une persistance', () => {
    // `appearance-store` est le seul store autorisé : c'est un réglage
    // d'affichage (taille de texte), pas une règle métier.
    const forbidden = [
      /from '@\/services\//,
      /from '@\/domains\//,
      /from '@\/infrastructure\//,
      /memorization-service/,
      /powersync/,
      /from '@\/store\/(?!appearance-store|ui-store)/,
    ];
    for (const [index, name] of shellFiles.entries()) {
      const source = read('src', 'shells', name);
      for (const pattern of forbidden) {
        expect(
          pattern.test(source),
          `${name} (${shellFiles[index]}) importe ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it('les deux shells montent le même Outlet, donc les mêmes écrans', () => {
    for (const name of ['MobileShell.tsx', 'DesktopShell.tsx']) {
      const source = read('src', 'shells', name);
      expect(source).toMatch(/<Outlet \/>/);
    }
    // Et aucun répertoire d'écrans « desktop » dupliqué n'a été créé.
    const screens = readdirSync(join(root, 'app'));
    expect(screens).not.toContain('desktop');
  });
});

describe('panneau secondaire — monté seulement où il sert', () => {
  it('déclare une liste unique de routes de lecture', () => {
    expect(READING_PANEL_ROUTES.length).toBeGreaterThan(0);
    expect(isReadingRoute('/bible/chapter/joh/3')).toBe(true);
    expect(isReadingRoute('/memorization/session')).toBe(true);
    expect(isReadingRoute('/settings/appearance')).toBe(false);
    expect(isReadingRoute('/family/home')).toBe(false);
  });

  it('n’existe qu’au bureau', () => {
    const desktop = read('src', 'shells', 'DesktopShell.tsx');
    expect(desktop).toMatch(/isDesktop && isReadingRoute/);
  });

  it('agit sur de vrais réglages de lecture', () => {
    const panel = read('src', 'shells', 'ReadingPanel.tsx');
    expect(panel).toMatch(/useAppearanceStore/);
    expect(panel).toMatch(/setBibleFontSize/);
    expect(panel).toMatch(/toggleVerseNumbers/);
  });
});

describe('laboratoire de prévisualisation — development only', () => {
  it('n’est importé que sous import.meta.env.DEV', () => {
    const main = read('src', 'main.tsx');
    expect(main).toMatch(/import\.meta\.env\.DEV\s*\?\s*lazy\(\(\) => import\('\.\.\/app\/__dev\/responsive-preview'\)\)/);
    expect(main).toMatch(/\{import\.meta\.env\.DEV && ResponsivePreview && \(/);
  });

  it('utilise des iframes à largeur réelle, pas une transformation du mobile', () => {
    const lab = read('app', '__dev', 'responsive-preview.tsx');
    expect(lab).toMatch(/<iframe/);
    expect(lab).toMatch(/width: 390/);
    expect(lab).toMatch(/width: 1440/);
    // La largeur interne de l'iframe est la largeur visée, telle quelle.
    expect(lab).toMatch(/width: spec\.width/);
    // La projection visuelle (coque + échelle) vit dans le module de coques ;
    // l'iframe elle-même n'est jamais transformée, sinon la largeur de mise
    // en page changerait et les media queries mentiraient.
    const cases = read('src', 'dev', 'device-frames.tsx');
    expect(cases).toMatch(/transform: `scale\(\$\{scale\}\)`/);
    expect(lab).not.toMatch(/transform: `scale/);
  });

  it('isole le stockage avant tout module et refuse de démarrer sinon', () => {
    const frame = read('preview-frame.html');
    const shimIndex = frame.indexOf("defineProperty(window, 'localStorage'");
    const moduleIndex = frame.indexOf("script.src = '/src/main.tsx'");
    expect(shimIndex).toBeGreaterThan(-1);
    expect(shimIndex).toBeLessThan(moduleIndex);
    expect(frame).toMatch(/__VF_PREVIEW_STORAGE_ISOLATED__/);
    // Si l'isolation échoue, l'app n'est pas chargée du tout.
    expect(frame).toMatch(/if \(!isolated\) \{/);
  });

  it('ne synchronise que route, thème et rechargement', () => {
    const session = read('src', 'dev', 'preview-session.ts');
    const handled = [...session.matchAll(/case '(vf:preview:[a-z]+)'/g)].map((m) => m[1]).sort();
    // `hello` n'est qu'un accusé de réception (re-demande d'état) : il ne
    // transporte aucune donnée applicative.
    expect(handled).toEqual([
      'vf:preview:appearance',
      'vf:preview:hello',
      'vf:preview:navigate',
      'vf:preview:reload',
    ]);
    // Aucun envoi d'événement applicatif : le laboratoire ne rejoue pas les
    // saisies ni les mutations.
    expect(session).not.toMatch(/postMessage\([^)]*mutation/i);
  });

  it('n’est pas une entrée de build', () => {
    const vite = read('vite.config.ts');
    expect(vite).toMatch(/input: resolve\(__dirname, 'index\.html'\)/);
    expect(vite).not.toMatch(/preview-frame\.html/);
  });
});
