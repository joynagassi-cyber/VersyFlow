/**
 * Contrat des COQUILLES et des FEUILLES MODALES.
 *
 * L'audit, en comptant :
 *   • la barre d'onglets faisait apparaître un point d'état de 4 px : la barre
 *     se décalait à chaque changement d'onglet ;
 *   • son nom accessible (« Navigation principale ») était écrit en français
 *     dans le composant ;
 *   • les commandes de l'en-tête de bureau mesuraient 36 px, sous la cible de
 *     40 px que la coquille mobile respectait déjà ;
 *   • la feuille modale peignait `--color-surface` en dur : un rectangle
 *     opaque posé sur un thème teinté, et aucun verre sur fond image ;
 *   • chaque champ redessinait son focus (`ring`, parfois bleu système) au lieu
 *     de suivre l'accent du thème.
 *
 * Ce fichier verrouille la coquille : ce sont les éléments présents sur
 * CHAQUE écran, donc ceux dont une incohérence se voit partout.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const css = read('src/styles/globals.css');

describe('barre d’onglets', () => {
  const tabs = read('src/components/navigation/BottomTabs.tsx');

  it('l’indicateur d’onglet est toujours rendu (aucun saut de 4 px)', () => {
    expect(tabs).not.toMatch(/\{active && <span/);
    expect(tabs).toMatch(/h-1 w-1 rounded-full transition-colors/);
    expect(tabs).toMatch(/active \? 'bg-primary' : 'bg-transparent'/);
  });

  it('la navigation a un nom accessible traduit', () => {
    expect(tabs).toMatch(/aria-label=\{t\('shell\.mainNav'/);
    expect(read('src/i18n/locales/fr.ts')).toContain('mainNav:');
    expect(read('src/i18n/locales/en.ts')).toContain('mainNav:');
  });

  it('un onglet annonce l’onglet courant', () => {
    expect(tabs).toContain("aria-current={active ? 'page' : undefined}");
  });
});

describe('en-tête et tiroir', () => {
  it('les commandes de l’en-tête de bureau atteignent la cible tactile', () => {
    const header = read('src/shells/DesktopHeader.tsx');
    expect(header).not.toMatch(/h-9 w-9/);
    expect(header).toMatch(/h-10 w-10/);
  });

  it('les icônes seules des coquilles portent un nom accessible', () => {
    for (const path of [
      'src/shells/MobileShell.tsx',
      'src/shells/DesktopHeader.tsx',
      'src/components/navigation/BottomTabs.tsx',
      'src/components/navigation/HamburgerMenu.tsx',
      'src/components/navigation/QuickDock.tsx',
    ]) {
      const text = read(path);
      const buttons = text.match(/<button[\s\S]*?<\/button>/g) ?? [];
      for (const button of buttons) {
        const hasText = /<\/DuoIcon>|>\s*\{t\(|>[A-Za-zÀ-ÿ]/.test(button.replace(/<DuoIcon[\s\S]*?\/>/, ''));
        const labelled = /aria-label=/.test(button);
        expect(labelled || hasText, `${path} : une commande sans nom accessible`).toBe(true);
      }
    }
  });

  it('les commandes de fermeture et de menu mesurent 40 px', () => {
    for (const path of [
      'src/components/navigation/HamburgerMenu.tsx',
      'src/components/navigation/QuickDock.tsx',
    ]) {
      expect(read(path), `${path} doit utiliser .touch-target`).toContain('touch-target');
      expect(read(path)).not.toMatch(/rounded-full p-1\.5/);
    }
  });
});

describe('feuille modale — le matériau du thème', () => {
  it('n’est pas un blanc opaque', () => {
    expect(css).toMatch(/\.modal-sheet-panel\s*\{[\s\S]{0,260}?background:\s*var\(--gc\)/);
    expect(css).not.toMatch(/\.modal-sheet-panel\s*\{[^}]*background:\s*var\(--color-surface\)/);
  });

  it('devient du verre sur fond image, et redevient pleine si on le demande', () => {
    expect(css).toMatch(/html\[data-bg='image'\] \.modal-sheet-panel\s*\{[^}]*backdrop-filter/);
    expect(css).toMatch(/prefers-reduced-transparency: reduce[\s\S]{0,200}?\.modal-sheet-panel/);
  });
});

describe('champs de saisie — un seul focus', () => {
  it('le focus suit l’accent du thème', () => {
    expect(css).toMatch(
      /:where\(input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\), textarea, select\):focus-visible\s*\{[\s\S]{0,200}?var\(--color-primary\)/,
    );
  });

  it('les cases et boutons radio gardent leur propre indicateur', () => {
    expect(css).toMatch(/input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\)/);
  });
});
