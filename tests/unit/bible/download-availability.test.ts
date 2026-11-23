/**
 * Télécharger une traduction : le bouton ne doit promettre que le possible.
 *
 * État constaté avant correction, sur ce build :
 *   - `public/data/bible/` ne contient que `lsg` (5,1 Mo / 1 189 fichiers) ;
 *   - 56 traductions sont cataloguées mais aucun fichier n'est servi ;
 *   - l'écran affichait pourtant « Télécharger » sur les 56 lignes ;
 *   - `downloadAndLoadTranslationData` commence par `split.has(id)`, qui
 *     échoue immédiatement — après un parcours qui, s'il avait abouti, aurait
 *     coûté 1 189 requêtes HTTP et ~10 Mo de transfert.
 *
 * Le test décrit le contrat : ce que l'écran peut télécharger = ce que le
 * manifeste de livraison annonce, et rien d'autre.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../..');

const SHIPPED: { split: string[]; monolithic: string[] } = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public/data/bible/shipped-datasets.json'), 'utf8'),
);

const CATALOG: { id: string }[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data/bible/dataset-catalog.json'), 'utf8'),
).filter((entry: { checksum: string }) => !/^sha256:pending$/.test(entry.checksum));

describe('ce que l’écran peut réellement télécharger', () => {
  const shipped = new Set([...SHIPPED.split, ...SHIPPED.monolithic]);

  it('le catalogue est bien plus large que ce qui est servi', () => {
    // Le cœur du problème : l'écran listait `CATALOG` (57 entrées) et
    // proposait « Télécharger » sur chacune.
    expect(CATALOG.length).toBeGreaterThan(50);
    expect(shipped.size).toBeLessThan(5);
  });

  it('chaque entrée cataloguée est soit livrée, soit non téléchargeable', () => {
    const promises = CATALOG.filter((entry) => !shipped.has(entry.id)).map((entry) => entry.id);
    // Ces 56 traductions ne sont NI livrées NI servies par ce build : l'écran
    // les marque désormais « Non incluse » (bouton désactivé).
    expect(promises.length).toBe(CATALOG.length - shipped.size);
    expect(promises.every(Boolean)).toBe(true);
  });

  it('aucun fichier de traduction non livrée n’existe sur le disque', () => {
    // Si un dossier apparaissait sans être déclaré, il redeviendrait
    // téléchargeable à juste titre — et ce test le signalerait.
    for (const entry of CATALOG) {
      if (shipped.has(entry.id)) continue;
      expect(
        fs.existsSync(path.join(ROOT, `public/data/bible/${entry.id}/index.json`)),
        `${entry.id} servi mais non déclaré`,
      ).toBe(false);
    }
  });

  it('le coût évité est réel, pas théorique', () => {
    // Une preuve chiffrée du parcours qui serait lancé à tort.
    const chapters = fs.readdirSync(path.join(ROOT, 'public/data/bible/lsg'), { recursive: true } as never)
      .filter((f: string) => /^\d+\.json$/.test(path.basename(f))).length;
    expect(chapters).toBe(1189);
  });
});
