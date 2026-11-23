/**
 * Garde-fou — aucun écran ne promet une synchronisation qui n'existe plus.
 *
 * VersyFlow n'a plus de service cloud (D1) : les données vivent sur l'appareil.
 * Les écrans de la famille venaient pourtant d'un temps où un serveur distant
 * recevait les réponses « dès la reconnexion ». Trois libellés le promettaient
 * encore :
 *
 *   - la séance en famille (« tes stats seront partagées à la reconnexion ») ;
 *   - son état non partagé (« {{count}} résultats en attente ») ;
 *   - l'écran de synchronisation (« ils partiront dès que la connexion
 *     revient »).
 *
 * C'est faux deux fois : rien ne part, et l'écran laisse croire que la donnée
 * est en transit alors qu'elle est simplement déjà écrite. Ce test lit les
 * catalogues `fr`/`en` et échoue si l'un de ces vocabulaires revient dans
 * `familyPlus` (le namespace des écrans de famille).
 *
 * Les libellés **conservés** autorisés sont ceux qui décrivent l'état réel :
 * « sur cet appareil », « reste ici », « pas de serveur distant ».
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

/**
 * Formules qui supposent un envoi différé vers un serveur.
 * Comparées en minuscules, apostrophes normalisées.
 */
const FORBIDDEN: readonly { label: string; pattern: RegExp }[] = [
  { label: 'partage à la reconnexion', pattern: /partag[ée]s?[^.]*reconnexion/ },
  { label: 'envoi au retour de la connexion', pattern: /partir[^.]*connexion revient/ },
  { label: 'promesse de synchronisation différée', pattern: /seront? (?:synchronis|envoy|partag)/ },
  { label: 'compteur « en attente » pour des données locales', pattern: /résultats en attente/ },
  { label: 'live sans réserve en mode local', pattern: /partagées en direct/ },
  {
    label: 'shared once you reconnect',
    pattern: /(?:shared|sent)[^.]*once you reconnect/,
  },
  { label: 'will leave once the connection', pattern: /leave[^.]*connection is back/ },
];

/** Extrait le bloc `familyPlus` d'un catalogue TypeScript (accolades équilibrées). */
function namespace(lang: string): string {
  const source = readFileSync(join(ROOT, `src/i18n/locales/${lang}.ts`), 'utf8');
  const start = source.indexOf('  familyPlus: {');
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`bloc familyPlus non fermé dans ${lang}`);
}

const blocks = { fr: namespace('fr'), en: namespace('en') };

describe('synchronisation familiale — aucun envoi promis', () => {
  for (const lang of ['fr', 'en'] as const) {
    it(`le catalogue ${lang} ne promet pas d’envoi vers un serveur`, () => {
      const text = blocks[lang].toLowerCase().replace(/’/g, "'");
      const found = FORBIDDEN.filter(({ pattern }) => pattern.test(text)).map(
        ({ label }) => label,
      );
      expect(found).toEqual([]);
    });
  }

  it('dit où sont les données : sur cet appareil', () => {
    expect(blocks.fr).toContain('sessionLiveLocalHint');
    expect(blocks.fr).toContain('sur cet appareil');
    expect(blocks.en).toContain('sessionLiveLocalHint');
    expect(blocks.en).toContain('on this device');
  });

  it('les clés retirées ne sont plus référencées par un écran', () => {
    for (const key of ['familyPlus.pendingHint2', 'familyPlus.offlineHint', 'familyPlus.pendingHint']) {
      const hits = ['app/family/session/live.tsx', 'app/family/sync.tsx', 'app/family/session/prepare.tsx']
        .map((file) => readFileSync(join(ROOT, file), 'utf8'))
        .filter((source) => source.includes(key));
      expect(`${key} : ${hits.length}`).toBe(`${key} : 0`);
    }
  });
});
