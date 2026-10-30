/**
 * L2 / L7 / L8 — Trois contrats de mise en page qui ne se voient qu'à l'usage,
 * mais qui se vérifient dans la source ET dans le CSS compilé.
 *
 *   L2  Les parcours de lecture (mémorisation, révision, chapitre, verset)
 *       demandent EXPLICITEMENT la colonne de lecture : ils ne dépendent pas
 *       d'un défaut qui pourrait changer sans qu'on s'en aperçoive.
 *   L7  Une feuille modale est un tiroir bas sur téléphone et une boîte
 *       centrée au-delà de 768 px — même composant, deux formes, aucun état
 *       React à synchroniser.
 *   L8  À 768 px, le rail de navigation remplace la barre d'onglets basse :
 *       jamais deux navigations montées en même temps.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');
const globals = read('src/styles/globals.css');

describe('L2 — colonne de lecture des parcours', () => {
  const journeys = [
    'app/memorization/session.tsx',
    'app/review/queue.tsx',
    'app/bible/chapter.tsx',
    'app/semantic/verse.tsx',
  ];

  it('les quatre écrans de lecture demandent explicitement la colonne', () => {
    for (const file of journeys) {
      expect(existsSync(resolve(root, file))).toBe(true);
      expect(read(file)).toMatch(/<FullScreenPage[\s\S]{0,400}?column="narrow"/);
    }
  });

  it('la largeur vient de --reading-width, pas d’une valeur locale', () => {
    expect(globals).toMatch(/--reading-width:\s*720px/);
    expect(globals).toMatch(/\.screen-column-narrow\s*\{[\s\S]{0,120}max-width:\s*100%/);
    const desktopRule = globals.match(
      /@media \(min-width: 1024px\) \{\s*\.screen-column\s*\{[\s\S]*?\.screen-column-narrow\s*\{[^}]*max-width:\s*var\(--reading-width\)/,
    );
    expect(desktopRule).not.toBeNull();
  });

  it('aucun écran de lecture ne réintroduit un plafond en dur', () => {
    for (const file of journeys) {
      expect(read(file)).not.toMatch(/max-w-md/);
    }
  });
});

describe('L7 — feuille modale, deux formes', () => {
  it('le CSS définit la feuille et son panneau', () => {
    expect(globals).toMatch(/\.modal-sheet\s*\{[^}]*position:\s*fixed/);
    expect(globals).toMatch(/\.modal-sheet-panel\s*\{[^}]*max-height:\s*82vh/);
  });

  it('au-delà de 768 px, le panneau est centré, borné à 680 px, sans poignée', () => {
    const block = globals.slice(globals.indexOf('.modal-sheet {'));
    const media = block.slice(block.indexOf('@media (min-width: 768px)'));
    expect(media).toMatch(/\.modal-sheet\s*\{[^}]*align-items:\s*center/);
    expect(media).toMatch(/\.modal-sheet-panel\s*\{[^}]*width:\s*min\(680px/);
    expect(media).toMatch(/\.modal-sheet-handle\s*\{\s*display:\s*none/);
  });

  it('les deux feuilles de l’application passent par ce couple de classes', () => {
    for (const file of [
      'app/comparison/translation.tsx',
      'src/components/navigation/QuickDock.tsx',
    ]) {
      const src = read(file);
      expect(src).toMatch(/modal-sheet"/);
      expect(src).toMatch(/modal-sheet-panel/);
      // Plus aucune feuille ne se colle elle-même en bas de l'écran.
      expect(src).not.toMatch(/fixed inset-x-0 bottom-0 max-h-\[82vh\]/);
    }
    expect(read('src/components/navigation/QuickDock.tsx')).toMatch(/modal-sheet-handle/);
  });
});

describe('L8 — rail de tablette et en-tête', () => {
  it('le seuil tablette est 768 px et il pilote le rail', () => {
    const hook = read('src/hooks/useIsDesktop.ts');
    expect(hook).toMatch(/TABLET_MIN_WIDTH\s*=\s*700/);
    expect(hook).toMatch(/DESKTOP_MIN_WIDTH\s*=\s*1100/);
    expect(hook).toMatch(/export function useIsRail/);

    // Depuis le scaffolding desktop, la structure vit dans `src/shells/` :
    // le rail n'est monté que par la coquille de bureau, les onglets bas et le
    // dock uniquement par la coquille mobile. Le contrat est identique.
    const appShell = read('src/shells/AppShell.tsx');
    const mobile = read('src/shells/MobileShell.tsx');
    const desktop = read('src/shells/DesktopShell.tsx');
    expect(appShell).toMatch(/kind === 'mobile' \? <MobileShell \/> : <DesktopShell \/>/);
    expect(desktop).toMatch(/<DesktopRail \/>/);
    expect(mobile).toMatch(/<BottomTabs \/>/);
    expect(mobile).toMatch(/<QuickDock \/>/);
    // Et surtout : aucun des deux ne contient la navigation de l'autre.
    expect(desktop).not.toMatch(/BottomTabs|QuickDock|HamburgerMenu/);
    expect(mobile).not.toMatch(/DesktopRail/);
  });

  it('le CSS applique le rail replié dès 768 px, dépliable à 1024 px', () => {
    const tablet = globals.match(/@media \(min-width: 700px\) \{[\s\S]*?--rail:\s*var\(--rail-collapsed\);/);
    expect(tablet).not.toBeNull();
    const desktop = globals.match(
      /@media \(min-width: 1100px\) \{[\s\S]*?:root\[data-rail='expanded'\][\s\S]*?--rail:\s*var\(--rail-expanded\);/,
    );
    expect(desktop).not.toBeNull();
  });

  it('le rail ne peut pas être déplié sur tablette (aucun choix inutile)', () => {
    const rail = read('src/components/navigation/DesktopRail.tsx');
    expect(rail).toMatch(/const collapsed = !isDesktop \|\| railMode === 'collapsed'/);
    expect(rail).toMatch(/\{isDesktop && \(/);
  });

  it('la largeur du rail reste une seule variable, écrite par le rail', () => {
    expect(globals).toMatch(/--rail-expanded:\s*236px/);
    expect(globals).toMatch(/--rail-collapsed:\s*72px/);
    expect(globals).toMatch(/\.app-main\s*\{[^}]*margin-inline-start:\s*var\(--rail\)/);
  });
});
