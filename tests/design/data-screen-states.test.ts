/**
 * Les trois états d'un écran de données (playbook E01, I02).
 *
 * Ce que ces tests tiennent, et pourquoi ils existent : trois écrans
 * affichaient leurs données par défaut (`0`, tableaux vides) pendant le
 * chargement, et **avalaient l'échec dans un `catch` muet**. L'utilisateur
 * lisait « 0/14 succès » alors que la lecture avait échoué : l'écran mentait,
 * sans un mot. Un squelelette, un état d'erreur qui dit que rien n'est perdu,
 * et une reprise : c'est le minimum, et c'est mesurable dans le fichier.
 *
 * Ce que ces tests ne tiennent pas : que les états soient *atteignables* (il
 * faudrait provoquer la panne du service) ni qu'ils soient jolis. Cela reste
 * « partiel » dans `docs/design/PLAYBOOK-AUDIT.md`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/** Les écrans de données qui portent leur propre chargement (pas de coquille). */
const DATA_SCREENS = [
  'app/achievements/index.tsx',
  'app/mastery/index.tsx',
  'app/profile/index.tsx',
];

describe('E01 — un écran de données montre son chargement, son échec, son vide', () => {
  for (const path of DATA_SCREENS) {
    describe(path, () => {
      const text = read(path);

      it('réserve la place pendant le chargement (squelette, pas des zéros)', () => {
        // Un squelette NOMMÉ (composant) ou un état de chargement explicite :
        // `profile` réserve ses tuiles en « – » plutôt qu'en faux zéros, ce
        // qui est la même promesse tenue autrement.
        expect(text, 'la place est réservée').toMatch(/Skeleton|StatTile|loading/);
        expect(text, 'le chargement a un état explicite').toMatch(/[Ll]oading|isLoading/);
      });

      it('dit l’échec au lieu de l’avaler', () => {
        // Un `catch` qui ne fait que journaliser laisse l'écran afficher son
        // état par défaut. Il doit poser un état visible.
        expect(text, 'l’échec pose un état').toMatch(/setFailed|setError|setLoadError|setStatsFailed/);
        expect(text, 'l’échec est annoncé').toMatch(/role="alert"|role="status"/);
        expect(text, 'l’échec propose une reprise').toMatch(/retry|Reessayer|Réessayer|setAttempt/);
      });

      it('n’affiche pas la coquille vide quand il n’y a rien', () => {
        // Une branche vide a trois formes légitimes : le composant
        // `EmptyState`, une garde en ligne (`.length === 0 ?`), ou une
        // condition `> 0`. Ce qui est interdit est de n'en avoir aucune et de
        // laisser la coquille s'afficher à zéro.
        expect(text, 'une branche vide existe').toMatch(
          /EmptyState|\.length\s*===?\s*0\s*\?|\.length\s*[<>]=?\s*0\s*&&|\?\?\s*null/,
        );
      });
    });
  }
});
