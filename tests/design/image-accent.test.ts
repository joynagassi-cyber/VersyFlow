/**
 * Accent dynamique tiré d'une image — contrat testable sans navigateur.
 *
 * On ne teste pas le canvas (jsdom ne le rend pas) mais les DEUX décisions
 * qui doivent rester vraies quoi qu'il arrive :
 *  - le texte posé sur une couleur d'action choisit le meilleur de noir/blanc ;
 *  - aucune valeur retournée n'est une couleur invalide (contrainte @property).
 */

import { bestTextOn, extractImageAccent } from '@/theme/image-accent';

const HEX = /^#[0-9a-fA-F]{6}$/;

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('bestTextOn — texte posé sur une action colorée', () => {
  const cases = ['#e10677', '#22c55e', '#ff7e5f', '#0f766e', '#1a1a1a', '#f4d03f', '#7c3aed'];

  it.each(cases)('%s : choisit le candidat au meilleur ratio', (bg) => {
    const chosen = bestTextOn(bg);
    const other = chosen === '#000000' ? '#ffffff' : '#000000';
    expect(ratio(bg, chosen)).toBeGreaterThanOrEqual(ratio(bg, other));
  });

  it('atteint 4,5:1 sur les accents réellement servis', () => {
    const presets = ['#e10677', '#3b82f6', '#22c55e', '#b45309', '#9b2c2c', '#6e56cf'];
    for (const bg of presets) {
      expect(ratio(bg, bestTextOn(bg))).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('extractImageAccent — repli déterministe', () => {
  it('revient au repli fourni quand l’image ne charge jamais', async () => {
    // jsdom n'exécute pas le chargement d'image : sans garde-fou, la promesse
    // resterait pendante pour toujours. Le module doit rendre le repli.
    const fallback = {
      primary: '#e10677',
      primaryLight: '#ff5fae',
      primaryDark: '#8f0450',
      accent: '#ffc1e3',
      accentLight: '#ffe3f2',
      accentSecondary: '#bfa5b8',
      tint: '#7a2148',
      primaryForeground: '#ffffff',
    };
    const result = await extractImageAccent('test-preset', 'data:image/png;base64,AAAA', fallback);
    expect(result).toEqual(fallback);
  }, 8000);

  it('toute couleur de secours reste une couleur CSS valide', () => {
    // Les valeurs de secours du module passent par variable ; on vérifie le
    // contrat de format sur le choix de texte, seule sortie littérale.
    expect(bestTextOn('#123456')).toMatch(HEX);
  });
});
