/**
 * Garde-fou — un chiffre jamais mesuré s'affiche « — », pas « 0 ».
 *
 * `analytics/dashboard.tsx` lisait `stats?.totalVerses || 0` : quand
 * `calculateStats()` échouait (elle avale ses erreurs), `stats` restait `null`
 * et l'écran affichait « 0 verset mémorisé · 0 maîtrisé · série 0 ». Trois zéros
 * qui n'avaient jamais été mesurés — la règle D5 (un point non mesurable n'est
 * jamais compté comme réussi) vaut aussi pour l'affichage.
 *
 * Le test lit la source de l'écran : c'est une règle de rendu, pas une fonction
 * pure, et monter tout l'écran (profil, FSRS, repositories, graphiques) pour
 * vérifier trois libellés serait disproportionné.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const DASHBOARD = readFileSync(join(ROOT, 'app/analytics/dashboard.tsx'), 'utf8');

describe('tableau de bord analytique — chiffres mesurés', () => {
  it('ne remplace plus une valeur absente par zéro', () => {
    // `stats?.x || 0` confond « pas de donnée » et « zéro mesuré ».
    expect(DASHBOARD).not.toMatch(/stats\?\.\w+\s*\|\|\s*0/);
  });

  it('affiche un tiret tant que rien n’a été mesuré', () => {
    expect(DASHBOARD).toContain('const [measured, setMeasured] = useState(false)');
    expect(DASHBOARD).toContain('useAnalyticsCapability.getState().stats !== null');
    // Les quatre familles de chiffres suivent le même drapeau.
    const guarded = DASHBOARD.match(/measured \?/g) ?? [];
    expect(guarded.length).toBeGreaterThanOrEqual(5);
  });

  it('relance la mesure au rafraîchissement, sans repartir d’un écran vide', () => {
    expect(DASHBOARD).toContain('setLoading(true);');
    expect(DASHBOARD).toContain('fireAndForget(loadData()');
  });
});
