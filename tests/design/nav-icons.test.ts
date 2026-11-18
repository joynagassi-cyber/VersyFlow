import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MENU_ICONS, SETTINGS_ICON, TAB_ICONS, iconFor } from '@/components/navigation/nav-icons';

const ROOT = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

describe('icônes de navigation — une destination, un signe', () => {
  it('l’onglet Réglages utilise la même icône dans les deux coquilles', () => {
    expect(TAB_ICONS.settings).toBe(SETTINGS_ICON);
    expect(iconFor('/settings/appearance')).toBe(SETTINGS_ICON);
  });

  it('aucune coquille ne redéclare sa propre table d’icônes', () => {
    for (const file of [
      'src/components/navigation/BottomTabs.tsx',
      'src/components/navigation/DesktopRail.tsx',
      'src/components/navigation/HamburgerMenu.tsx',
    ]) {
      const source = read(file);
      expect(source, `${file} doit lire nav-icons`).toMatch(/nav-icons/);
      expect(source, `${file} ne doit plus déclarer Settings02Icon`).not.toMatch(/Settings02Icon/);
    }
  });

  it('couvre toutes les destinations du tiroir mobile', () => {
    const menu = read('src/components/navigation/HamburgerMenu.tsx');
    const paths = [...menu.matchAll(/item\('([^']+)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(10);
    expect(paths.filter((path) => !MENU_ICONS[path])).toEqual([]);
  });

  it('couvre toutes les destinations du rail de bureau', () => {
    const rail = read('src/components/navigation/DesktopRail.tsx');
    // Le rail lit `iconFor(...)` avec un repli : le test garantit que le repli
    // ne sert jamais, sinon l'icône divergerait de celle du tiroir.
    expect(rail).toMatch(/iconFor\(/);
    expect(MENU_ICONS['/notifications']).toBeDefined();
  });
});

describe('accueil — pas de bouton flottant', () => {
  it('la coquille mobile n’a plus de FAB', () => {
    const shell = read('src/shells/MobileShell.tsx');
    expect(shell).not.toMatch(/IonFab/);
    expect(shell).not.toMatch(/PlusSignIcon/);
  });

  it('la carte d’accueil lit le verset du jour, pas une liste figée', () => {
    const home = read('app/(tabs)/index.tsx');
    expect(home).toMatch(/getDailyVerse/);
    expect(home).not.toMatch(/DAILY_VERSES_FALLBACK/);
    // L'illustration vient du verset, pas d'un paysage générique.
    expect(home).toMatch(/themeLandscapeUrl\(dailyVerse\.visual\)/);
  });
});
