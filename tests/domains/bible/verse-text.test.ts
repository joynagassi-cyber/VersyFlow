import { describe, expect, it } from 'vitest';
import { cleanVerseText, hasVerseMarkers } from '@/domains/bible/verse-text';

/**
 * Ces cas viennent du corpus réel : Luc 13,25-28 affichait les marqueurs
 * `j` / `j*` à l'écran, collés au texte.
 */
describe('cleanVerseText', () => {
  it('retire le marqueur de début de verset', () => {
    expect(cleanVerseText('j Quand le maître de la maison se sera levé')).toBe(
      'Quand le maître de la maison se sera levé',
    );
  });

  it('remplace le retour à la ligne interne par une espace', () => {
    expect(cleanVerseText('mal,j*j à cause de moi.')).toBe('mal, à cause de moi.');
  });

  it('retire la marque de fin de paragraphe', () => {
    expect(cleanVerseText('qui sort de la bouche de Dieu.j*')).toBe(
      'qui sort de la bouche de Dieu.',
    );
  });

  it('nettoie le verset complet de Luc 13,25', () => {
    const raw =
      'j Quand le maître de la maison se sera levé etj*j aura fermé la porte, et que vous, étant dehors, vous commencerez à frapper à la porte, en disant: Seigneur, Seigneur, ouvre-nous! Il vous répondra: Je ne sais d’où vous êtes.j*';
    const clean = cleanVerseText(raw);
    expect(clean).not.toContain('j*');
    expect(clean).toBe(
      'Quand le maître de la maison se sera levé et aura fermé la porte, et que vous, étant dehors, vous commencerez à frapper à la porte, en disant: Seigneur, Seigneur, ouvre-nous! Il vous répondra: Je ne sais d’où vous êtes.',
    );
  });

  it('garde le pronom « je » élidé en début de verset', () => {
    // Le corpus contient « j’ai placé mon arc dans la nue » : une règle qui
    // retirait tout `j` initial amputait le pronom.
    expect(cleanVerseText('j’ai placé mon arc dans la nue')).toBe('j’ai placé mon arc dans la nue');
    expect(cleanVerseText('j’en prends aujourd’hui à témoin')).toBe('j’en prends aujourd’hui à témoin');
    expect(cleanVerseText('J’ai des bœufs et des ânes')).toBe('J’ai des bœufs et des ânes');
  });

  it('ne touche jamais un « j » à l’intérieur d’un mot', () => {
    for (const word of ['aujourd’hui', 'justement', 'Jésus', 'je', 'déjà', 'projet']) {
      expect(cleanVerseText(word)).toBe(word);
      expect(cleanVerseText(`${word} et ${word}`)).toBe(`${word} et ${word}`);
    }
  });

  it('est idempotent', () => {
    const raw = 'j Alors vous vous mettrez à dire: mal,j*j à cause de moi.j*';
    const once = cleanVerseText(raw);
    expect(cleanVerseText(once)).toBe(once);
  });

  it('signale un verset encore marqué', () => {
    expect(hasVerseMarkers('Dieu.j*')).toBe(true);
    expect(hasVerseMarkers('j Heureux les pauvres')).toBe(true);
    expect(hasVerseMarkers('aujourd’hui, Jésus est né.')).toBe(false);
  });
});
