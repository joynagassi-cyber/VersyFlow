/**
 * Garde-fou — l'accueil ne fabrique pas « 0 verset mémorisé » quand la lecture
 * a échoué.
 *
 * `app/(tabs)/index.tsx` garde ses compteurs en `number | null` — `null` voulant
 * dire « pas lu ». Deux défauts s'y étaient glissés :
 *
 *   1. les libellés passaient par `total ?? 0` : la tuile affichait
 *      « 0 verset mémorisé » à gauche et « – » à droite, dans la même tuile ;
 *   2. le `catch` ne remettait à `null` que deux compteurs sur cinq : après un
 *      échec, `total`, `mastered` et la liste récente gardaient la valeur de la
 *      lecture précédente — ou restaient à zéro.
 *
 * Le test lit la source : ce sont des règles de rendu et de reprise sur erreur,
 * pas des fonctions pures, et monter l'accueil complet (profil, familles,
 * thème, service de mémorisation) pour trois libellés serait disproportionné.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const HOME = readFileSync(join(ROOT, 'app/(tabs)/index.tsx'), 'utf8');

describe('accueil — compteurs mesurés', () => {
  it('ne remplace plus une valeur inconnue par zéro dans un libellé', () => {
    expect(HOME).not.toMatch(/formatProgressLabel\([\s\S]{0,120}\?\?\s*0/);
    expect(HOME).toContain('count === null');
    expect(HOME).toContain("t('home.dataUnavailable', 'Données indisponibles')");
  });

  it('remet TOUS les compteurs à « inconnu » sur échec', () => {
    const failure = HOME.slice(HOME.indexOf("console.error('[Home] Data load failed:'"));
    const block = failure.slice(0, failure.indexOf('}') + 1);
    for (const setter of [
      'setReviewsDue(null)',
      'setStreak(null)',
      'setTotal(null)',
      'setMastered(null)',
      'setRecentVerses([])',
    ]) {
      expect(`${setter} : ${block.includes(setter)}`).toBe(`${setter} : true`);
    }
  });

  it('garde la série lisible même négative ou non numérique', () => {
    // L'anneau à sept pastilles a été retiré (vocabulaire de tableau de bord),
    // mais la garde qu'il imposait reste due au TEXTE : une série négative ne
    // doit pas s'afficher « -1 jour consécutif ».
    expect(HOME).toContain('formatStreakDaysLabel(streak, locale)');
    expect(HOME).toMatch(/const plural = count > 1 \? 's' : ''/);
    // La ligne de série ne réintroduit ni cadran ni pastilles de jours.
    expect(HOME).not.toContain('strokeDasharray');
    expect(HOME).not.toContain('home-ring');
  });

  it('garde le tiret comme valeur affichée quand rien n’est mesuré', () => {
    expect(HOME).toContain("<strong>{value ?? '–'}</strong>");
  });
});

const CALENDAR = readFileSync(join(ROOT, 'app/review/calendar.tsx'), 'utf8');
const PROFILE = readFileSync(join(ROOT, 'app/profile/index.tsx'), 'utf8');

describe('autres écrans à compteurs — même règle', () => {
  it('le calendrier de révision affiche « — » au lieu de zéro', () => {
    expect(CALENDAR).toContain("value: stats ? stats.streakCount : '—'");
    expect(CALENDAR).toContain("value: stats ? stats.totalVerses : '—'");
    expect(CALENDAR).not.toMatch(/value: `\$\{stats \? Math\.round/);
  });

  it('la bande de statistiques du profil ne formate pas un gabarit sans nombre', () => {
    // `formatProgressLabel(template, 0, locale)` écrivait « 0 verset mémorisé »
    // sous une valeur « — » : le libellé contredisait sa propre tuile.
    expect(PROFILE).toContain('? formatProgressLabel(');
    expect(PROFILE).not.toMatch(/formatProgressLabel\([\s\S]{0,80}\?\? 0/);
  });
});
