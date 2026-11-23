import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VerseTextSkeleton } from '@/components/ui/Skeleton';

/**
 * Le squelette de lecture ne doit pas redevenir « deux barres muettes ».
 * On vérifie donc trois choses mesurables sans navigateur : il annonce ce
 * qu'il fait, il est décoratif pour la partie visuelle, et il réserve
 * plusieurs paragraphes (donc une hauteur de texte, pas une vignette).
 */
describe('VerseTextSkeleton', () => {
  it('annonce le chargement une seule fois', () => {
    const html = renderToStaticMarkup(<VerseTextSkeleton label="Chargement du chapitre…" />);
    expect(html).toContain('Chargement du chapitre…');
    expect((html.match(/role="status"/g) ?? []).length).toBe(1);
  });

  it('garde les blocs décoratifs hors de l’arbre d’accessibilité', () => {
    const html = renderToStaticMarkup(<VerseTextSkeleton paragraphs={2} />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('aria-busy="true"');
    // Aucun libellé : un squelette déjà annoncé par son parent ne répète rien.
    expect(html).not.toContain('role="status"');
  });

  it('réserve une hauteur de texte, pas une vignette', () => {
    const html = renderToStaticMarkup(<VerseTextSkeleton paragraphs={3} />);
    // 3 paragraphes de 3 ou 4 lignes : au moins neuf lignes à la mesure.
    expect((html.match(/verse-text-skeleton-line/g) ?? []).length).toBeGreaterThanOrEqual(9);
    expect((html.match(/verse-text-skeleton-paragraph/g) ?? []).length).toBe(3);
  });

  it('termine chaque paragraphe par une ligne courte', () => {
    const html = renderToStaticMarkup(<VerseTextSkeleton paragraphs={2} />);
    expect((html.match(/verse-text-skeleton-line-last/g) ?? []).length).toBe(2);
  });
});
