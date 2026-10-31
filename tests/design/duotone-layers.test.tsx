/**
 * Le duotone n'est pas une apparence, c'est une structure DOM.
 *
 * Les icônes Solar « duotone » sont deux calques. Le premier suit
 * `currentColor`. Le second porte, en style en ligne, `color:
 * var(--solar-secondary-color, currentColor)` et `opacity:
 * var(--solar-secondary-opacity, .5)`.
 *
 * Conséquence : **la seconde couleur se pilote en CSS**, depuis n'importe quel
 * ancêtre, sans propager de prop et sans toucher les 549 appels à `DuoIcon`.
 * C'est ce contrat que ce fichier verrouille — s'il casse (montée de version de
 * la bibliothèque, changement de structure), toutes les variantes du
 * laboratoire deviennent silencieusement monochromes, ce qui est exactement le
 * défaut qu'on cherche à corriger.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Home01Icon } from '@/components/ui/solar-icons';

function secondaryLayers(container: HTMLElement): Element[] {
  return [...container.querySelectorAll('svg *')].filter((el) => {
    const inline = (el as SVGElement).style;
    return String(inline.color).includes('--solar-secondary-color');
  });
}

describe('calques des icônes Solar', () => {
  it('expose une seconde couche lisible par une variable CSS', () => {
    const { container } = render(<DuoIcon icon={Home01Icon} size={20} />);
    const layers = secondaryLayers(container);

    // Sans seconde couche, il n'y a pas de duotone : seulement un trait.
    expect(layers.length).toBeGreaterThan(0);
    for (const layer of layers) {
      // On lit l'attribut `style` brut : jsdom convertit `opacity` en nombre et
      // rend `var()` sous la forme « NaN », alors que le navigateur l'accepte.
      // Le contrat porte sur le texte émis, pas sur la normalisation de jsdom.
      const style = layer.getAttribute('style') ?? '';
      // La couleur vient d'une variable héritée, pas d'une valeur figée :
      // c'est ce qui permet de la changer depuis le thème, sans prop.
      expect(style).toContain('var(--solar-secondary-color');
    }
    // Note : jsdom refuse `opacity: var(...)` et l'écrit « NaN » — impossible
    // de vérifier ici la densité du voile. Elle se juge à l'écran, dans le
    // laboratoire ; le contrat de teinte, lui, est bien verrouillé ci-dessus.
  });

  it('ne fige aucune teinte dans le SVG : tout passe par currentColor', () => {
    const { container } = render(<DuoIcon icon={Home01Icon} size={20} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Le SVG lui-même ne porte pas de couleur propre : il hérite, donc il
    // suit le bouton, donc il suit l'état.
    expect(svg?.style.color ?? '').toBe('');
  });
});

describe('laboratoire des boutons duotone', () => {
  it('monte les cinq variantes dans les trois états, sans erreur', async () => {
    const { MemoryRouter } = await import('react-router-dom');
    const { default: DuotoneLab } = await import('../../app/__dev/duotone-lab');

    const { container } = render(
      <MemoryRouter>
        <DuotoneLab />
      </MemoryRouter>,
    );

    // Cinq règles comparées, trois états chacune : si une variante disparaît
    // du labo, la comparaison devient un choix entre moins d'options que ce
    // qui a été arbitré.
    expect(container.querySelectorAll('.dl-variant')).toHaveLength(5);
    for (const id of ['dl-v0', 'dl-vA', 'dl-vB', 'dl-vC', 'dl-vD']) {
      expect(container.querySelectorAll(`.${id}`).length, id).toBeGreaterThan(0);
    }
    // Chaque variante montre bien repos / survol / actif.
    expect(container.querySelectorAll('.dl-cell')).toHaveLength(15);
    expect(container.querySelectorAll('.dl-btn.is-active').length).toBeGreaterThan(0);
  });
});
