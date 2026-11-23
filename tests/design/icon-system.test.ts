import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home01Icon, FlameIcon } from '@/components/ui/solar-icons';
import { DuoIcon } from '@/components/ui/DuoIcon';

/**
 * Contrat des icônes du produit — remplace le contrat « duotone ».
 *
 * Décision : les icônes à deux calques sont abandonnées au profit d'icônes à
 * une seule couleur. La raison est mesurée : à 16 px, un trait de 1,75 px dont
 * le second calque est à 24 % d'opacité ne montre que 0,42 px de couleur — un
 * voile invisible, pas une teinte discrète.
 *
 * Ce que ce fichier protège désormais :
 *   1. l'icône est monochrome (aucune variante `duotone` ne revient) ;
 *   2. le trait est franc et arrondi ;
 *   3. l'état actif se signale par une pastille PLEINE d'accent, sur l'icône
 *      seule, et persiste tant que l'élément est actif ;
 *   4. l'accessibilité ne dépend pas de la couleur.
 */
describe('icônes Solar — une seule couleur', () => {
  it('monte une icône monochrome, pas un duotone', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, size: 20 }));
    // Solar nomme cette maison « home-smile » : c'est le tracé exact de l'ancienne
    // version duotone, sans son second calque.
    expect(html).toContain('solar-home-smile-linear');
    expect(html).not.toContain('line-duotone');
    expect(html).toContain('icon-ink');
  });

  it('garde une variante pleine pour les distinctions (flamme, médaille)', () => {
    // Ces cinq icônes-là restent `bold-duotone` : ce sont des accents
    // décoratifs (flamme, coupe, étoile), jamais des icônes d'action.
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: FlameIcon }));
    expect(html).toContain('solar-flame-bold-duotone');
  });

  it('pose un trait de 2 px, à extrémités arrondies', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }));
    // La bibliothèque écrit le trait dans le style du SVG racine, pas en
    // attribut (`style="…;stroke-width:2"`).
    expect(html).toMatch(/stroke-width:2/);
    expect(html).not.toMatch(/stroke-width:1\.75/);
    // Les tracés Solar portent `strokeLinecap:"round"` : c'est ce qui donne
    // l'arrondi demandé, sans surcharge de notre part.
    expect(html).toContain('stroke-linecap="round"');
  });

  it('ne fige aucune densité de second calque sur la racine du SVG', () => {
    const html = renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }));
    const styleMatch = html.match(/style="([^"]*)"/);
    if (styleMatch) expect(styleMatch[1]).not.toContain('--solar-secondary-opacity');
  });

  it('rend les icônes décoratives muettes et nomme les autres', () => {
    expect(renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon }))).toContain(
      'aria-hidden="true"',
    );
    expect(
      renderToStaticMarkup(createElement(DuoIcon, { icon: Home01Icon, 'aria-label': 'Accueil' })),
    ).toContain('aria-label="Accueil"');
  });
});

describe('pastille d’état — le signal de l’actif', () => {
  const css = readFileSync('src/styles/globals.css', 'utf8');

  const rule = (selector: string): string | null => {
    const re = new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm');
    const match = css.match(re);
    return match ? match[1] : null;
  };

  it('au repos, aucune pastille', () => {
    const body = rule('.tab-pill');
    expect(body, 'la pastille de base doit exister').not.toBeNull();
    expect(body!).toMatch(/background-color:\s*transparent/);
  });

  it('au survol, la pastille reste vide (survoler ≠ être ici)', () => {
    // Aucune règle de survol ne doit peindre `.tab-pill` : sinon la pastille
    // apparaîtrait sans que l'élément soit actif, et perdrait son sens.
    const hoverRules = [...css.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)].filter((m) =>
      /\.tab-pill/.test(m[1]),
    );
    for (const [, , body] of hoverRules) {
      expect(body).not.toMatch(/background-color:\s*var\(--acc\)/);
    }
  });

  it('à l’actif, pastille PLEINE d’accent et encre dédiée', () => {
    const body = rule(".tab-item[aria-current='page'] .tab-pill");
    expect(body, 'la pastille active doit exister').not.toBeNull();
    // Pleine : `var(--acc)` et non un mélange à 12 %.
    expect(body!).toMatch(/background-color:\s*var\(--acc\)/);
    // L'encre vient du jeton calculé par le thème : lisible sur accent clair
    // comme sur accent sombre, sans intervention par preset.
    expect(body!).toMatch(/color:\s*var\(--on-accent\)/);
  });

  it('l’icône active prend l’encre du thème, jamais du blanc en dur', () => {
    const body = rule(".tab-item[aria-current='page'] .solar.icon-ink");
    expect(body, 'l’encre de l’icône active doit exister').not.toBeNull();
    expect(body!).toMatch(/color:\s*var\(--on-accent\)/);
  });

  it('l’état actif vient de `aria-current`, pas d’une classe éphémère', () => {
    const tabs = readFileSync('src/components/navigation/BottomTabs.tsx', 'utf8');
    expect(tabs).toContain("aria-current={active ? 'page' : undefined}");
    // Aucune pastille conditionnée par un état React local : la sélection
    // survit donc aux re-rendus et au focus perdu.
    expect(css).toContain("[aria-current='page'] .tab-pill");
  });

  it('le rail de bureau garde une encre d’accent, pas l’encre d’aplat', () => {
    // Le fond actif du rail est une teinte CLAIRE (`--acc` à 13 %) : y poser
    // `--on-accent` (prévu pour un aplat) rendrait l'icône illisible.
    const body = rule(".nav-item[aria-current='page'] .solar.icon-ink");
    expect(body).not.toBeNull();
    expect(body!).toMatch(/color:\s*var\(--acc-text\)/);
    expect(body!).not.toMatch(/--on-accent/);
  });
});
