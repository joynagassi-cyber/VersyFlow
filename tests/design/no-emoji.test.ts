/**
 * Garde-fou — aucun emoji dans l'interface, ni dans les données de démonstration.
 *
 * Un emoji n'est pas une icône : il change de dessin selon la plateforme, ne
 * suit pas la couleur du thème, ne s'aligne pas sur la typographie et n'est pas
 * rendu par toutes les polices système. La charte impose une bibliothèque
 * d'icônes unique (`<DuoIcon />`) et des données de démo qui n'en portent pas.
 *
 * Ce test échoue sur le premier emoji trouvé dans :
 *   - `src/`, `app/` (le code de l'application) ;
 *   - `src/i18n/locales/` (les libellés, y compris les 45 traductions) ;
 *   - `tests/design/` et `tests/unit/` (fixtures : elles doivent ressembler
 *     aux vraies données).
 *
 * Ne sont pas des emoji et ne sont donc pas signalés : les flèches
 * typographiques (→ ← →), les symboles mathématiques, la ponctuation française
 * et les séparateurs (·, —, …, §).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

/** Dossiers scannés (chemins relatifs au dépôt). */
const ROOTS = ['src', 'app', 'tests/design', 'tests/unit'];

const TEXT_EXT = /\.(ts|tsx|js|jsx|json|md)$/;

/**
 * Plages Unicode des pictogrammes. Volontairement limitées aux blocs
 * « emoji » : les flèches (U+2190–U+21FF), la ponctuation générale
 * (U+2000–U+206F) et les symboles mathématiques (U+2200–U+22FF) restent
 * autorisés.
 */
const EMOJI_RANGES: [number, number][] = [
  [0x1f000, 0x1faff], // pictogrammes, émoticônes, transports, symboles divers
  [0x1f1e6, 0x1f1ff], // indicateurs régionaux (drapeaux)
  [0x2600, 0x27bf], // symboles divers + dingbats
  [0x2b00, 0x2bff], // flèches et symboles supplémentaires
  [0xfe0f, 0xfe0f], // sélecteur de variante emoji
  [0x1f3fb, 0x1f3ff], // modificateurs de teint
];

function isEmoji(codePoint: number): boolean {
  return EMOJI_RANGES.some(([from, to]) => codePoint >= from && codePoint <= to);
}

/** Un caractère est-il un pictogramme ? */
export function findEmoji(text: string): { char: string; index: number; line: number }[] {
  const found: { char: string; index: number; line: number }[] = [];
  let line = 1;
  let index = 0;
  for (const char of text) {
    if (char === '\n') line += 1;
    const codePoint = char.codePointAt(0) ?? 0;
    if (isEmoji(codePoint)) found.push({ char, index, line });
    index += char.length;
  }
  return found;
}

function walk(dir: string, out: string[] = []): string[] {
  let entries: ReturnType<typeof readdirSync> extends never ? never : import('node:fs').Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__snapshots__') continue;
      walk(full, out);
    } else if (entry.isFile() && TEXT_EXT.test(entry.name)) {
      out.push(relative(root, full));
    }
  }
  return out;
}

/** Le fichier de test lui-même décrit les plages : il s'auto-exclut. */
const SELF = 'tests/design/no-emoji.test.ts';

describe('charte — aucun emoji dans l’interface', () => {
  it('aucun fichier de code, de libellé ou de fixture ne contient d’emoji', () => {
    const offenders: string[] = [];
    for (const dir of ROOTS) {
      for (const file of walk(join(root, dir))) {
        if (file === SELF) continue;
        if (statSync(join(root, file)).size > 2_000_000) continue;
        const hits = findEmoji(readFileSync(join(root, file), 'utf8'));
        for (const hit of hits.slice(0, 3)) {
          offenders.push(`${file}:${hit.line} → « ${hit.char} »`);
        }
      }
    }
    expect(offenders, `Emoji trouvés :\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  it('la détection reconnaît un emoji et épargne la typographie', () => {
    // Reconnaît les pictogrammes…
    expect(findEmoji('Bienvenue 🏡')).toHaveLength(1);
    // Le cœur + son sélecteur de variante : un pictogramme, deux points de code.
    expect(findEmoji('Développé avec ❤️').length).toBeGreaterThanOrEqual(1);
    expect(findEmoji('Note ⭐')).toHaveLength(1);
    // …et laisse passer la ponctuation et les flèches.
    expect(findEmoji('Genèse → Exode · « texte » — … §')).toEqual([]);
    expect(findEmoji('L’Éternel est mon berger: je ne manquerai de rien.')).toEqual([]);
  });
});
