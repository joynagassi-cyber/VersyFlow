/**
 * Décision d'affichage des boutons duotone — **A · B · C**, verrouillée.
 *
 * Arbitrage : le duotone vient de l'**icône** (A), la couleur vit dans le
 * **contenant** (B), et l'**onglet mobile actif** remplit le pictogramme (C).
 *
 * Ce fichier ne teste pas des classes CSS pour elles-mêmes : il teste les
 * trois propriétés qui font qu'un état de navigation est lisible.
 *
 *   1. **Le repos est coloré.** La seconde couche du duotone porte l'accent
 *      dès le repos ; sans ça on retombe sur un monochrome à deux densités.
 *   2. **Le survol ne change pas la teinte.** Il ne pose qu'un fond : c'est ce
 *      qui distingue « survoler » de « activer ». Avant, la couleur basculait
 *      d'un coup vers l'accent — le défaut d'origine.
 *   3. **L'activation ne dépend pas de la seule couleur.** Encre + fond +
 *      filet (rail), densité (onglet). Lisible en niveaux de gris.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const css = read('src/styles/globals.css');

/** Corps d'une règle CSS, à partir de son sélecteur, ancré en début de ligne. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm'));
  expect(match, `règle absente : ${selector}`).not.toBeNull();
  return match![1];
}

describe('A — le duotone de l’icône', () => {
  it('colore la seconde couche dès le repos', () => {
    const base = rule('.solar.solar-accent');
    expect(base).toContain('--solar-secondary-color: var(--acc)');
    expect(base).toMatch(/--solar-secondary-opacity:\s*0?\.24/);
  });

  it('tire son encre du thème, jamais d’une teinte figée', () => {
    const base = rule('.solar.solar-accent');
    expect(base).toMatch(/color:\s*color-mix\(in srgb,\s*var\(--tx\)/);
    expect(base).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it('ne perd pas le duotone sur une surface d’accent', () => {
    // Accent sur accent = icône invisible. Le second calque repasse au trait.
    const onAccent = rule('.bg-primary .solar.solar-accent');
    expect(onAccent).toContain('--solar-secondary-color: currentColor');
  });
});

describe('B — le contenant ne change pas la teinte, il la porte', () => {
  it('le survol ne repeint pas l’icône : il pose une pastille', () => {
    const hover = rule('.nav-item:hover,\n.nav-item:focus-visible');
    expect(hover).toContain('background-color');
    // Le défaut d'origine : une couleur d'icône qui bascule au survol.
    expect(hover).not.toMatch(/(^|[^-])color:/);
  });

  it('l’état actif cumule encre, fond et filet — pas seulement la couleur', () => {
    const active = rule(".nav-item[aria-current='page']");
    expect(active).toMatch(/color:\s*var\(--acc-text\)/);
    expect(active).toContain('background-color');
    expect(active).toContain('box-shadow: inset');
  });

  it('aucune règle ne fait basculer l’icône vers l’accent au survol', () => {
    // C'était l'ancienne règle, celle qui « prenait le contrôle ».
    expect(css).not.toMatch(/^\[aria-current='page'\]\s*\.solar\.solar-accent/m);
  });
});

describe('C — l’onglet mobile : la densité porte l’état', () => {
  it('est creux au repos et plein à l’actif', () => {
    const rest = rule('.tab-item .solar.solar-accent');
    const active = rule(".tab-item[aria-current='page'] .solar.solar-accent");
    const opacity = (body: string) => Number(body.match(/--solar-secondary-opacity:\s*(0?\.\d+)/)?.[1]);
    expect(opacity(rest)).toBeLessThanOrEqual(0.1);
    expect(opacity(active)).toBeGreaterThanOrEqual(0.45);
  });

  it('la pastille a des dimensions définies, pas héritées d’utilitaires', () => {
    // Le composant ne porte plus `h-8 w-12` : la taille vit ici, sinon la
    // pastille s'effondre à 0 × 0 sur une icône de 23 px.
    const pill = rule('.tab-pill');
    expect(pill).toMatch(/width:\s*48px/);
    expect(pill).toMatch(/height:\s*32px/);
    expect(pill).toContain('background-color: transparent');
  });
});

describe('une seule source de vérité', () => {
  it('les composants ne peignent plus leur couleur en utilitaires', () => {
    const rail = read('src/components/navigation/DesktopRail.tsx');
    const tabs = read('src/components/navigation/BottomTabs.tsx');
    // La contradiction venait de là : Tailwind d'un côté, globals.css de
    // l'autre, et le dernier chargé gagnait.
    expect(rail).not.toMatch(/text-primary'|bg-primary\/10/);
    expect(tabs).not.toMatch(/text-primary'|bg-primary\/12/);
    expect(rail).toContain("nav-item");
    expect(tabs).toContain("tab-item");
  });

  it('la règle morte qui promettait l’accent dès le repos a disparu', () => {
    // Elle affirmait le contraire de ce qui s'affichait : une intention
    // conservée dans le fichier mais écrasée par la cascade.
    expect(css).not.toMatch(/^\.solar\.solar-accent\s*\{\s*color:\s*var\(--color-primary\)/m);
  });
});
