/**
 * « Disponible » doit vouloir dire « dans le build ».
 *
 * Trois surfaces répondaient à cette question de trois façons différentes, et
 * deux mentaient :
 *
 *   - le registre asserait `available: true` pour `ostervald` et `kujv`, dont
 *     aucun dataset n'est versionné (un commentaire affirmait même le
 *     contraire : « both French datasets are bundled locally ») ;
 *   - l'onboarding se fiait au CATALOGUE (57 entrées, 1 livrée), donc
 *     n'affichait pas le badge « Téléchargement requis » ;
 *   - l'écran Profil basculait directement vers `ostervald` en un tap, sans
 *     retour possible depuis l'écran de réglages.
 *
 * Le point de vérité est `public/data/bible/shipped-datasets.json`, écrit par
 * `scripts/bible/split-lsg.mjs` à côté des fichiers qu'il décrit : il ne peut
 * pas annoncer un corpus absent.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');
const SHIPPED: { split: string[]; monolithic: string[] } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/data/bible/shipped-datasets.json'), 'utf8'),
);

describe('datasets réellement livrés', () => {
  const ids = [...new Set([...SHIPPED.split, ...SHIPPED.monolithic])];

  it('le manifeste ne liste que des fichiers présents', () => {
    for (const id of SHIPPED.split) {
      expect(fs.existsSync(path.join(ROOT, `public/data/bible/${id}/index.json`)), `${id} index`).toBe(
        true,
      );
    }
    for (const id of SHIPPED.monolithic) {
      expect(fs.existsSync(path.join(ROOT, `data/bible/${id}.json`)), `${id}.json`).toBe(true);
    }
  });

  it('réciproquement, tout fichier livré est dans le manifeste', () => {
    // Un dataset ajouté à la main sans relancer `bible:split` passerait
    // inaperçu : le manifeste serait en retard sur le disque.
    const onDisk = fs
      .readdirSync(path.join(ROOT, 'data/bible'))
      .filter(
        (name) =>
          name.endsWith('.json') &&
          name !== 'dataset-catalog.json' &&
          !name.includes('.sample.'),
      )
      .map((name) => name.replace(/\.json$/, ''));
    expect(new Set(SHIPPED.monolithic)).toEqual(new Set(onDisk));
  });

  it('ne prétend pas livrer 57 traductions', () => {
    // Le catalogue en liste 57 ; le build n'en contient qu’une poignée.
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThan(5);
  });

  it('la LSG, traduction par défaut, est livrée', () => {
    expect(ids).toContain('lsg');
  });
});
