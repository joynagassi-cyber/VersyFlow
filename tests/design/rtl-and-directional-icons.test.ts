/**
 * Sens d'écriture (playbook G05) — ce que ces tests tiennent :
 *
 *  1. la mise en page n'utilise **aucune direction physique** (`pl-`, `mr-`,
 *     `left-`, `right-`) : tout passe par les classes logiques (`ps-`, `me-`,
 *     `start-`, `end-`), qui se retournent d'elles-mêmes ;
 *  2. les **icônes directionnelles** (chevrons, flèches) sont marquées et
 *     miroirées en RTL — un chevron « suivant » qui pointe à droite dans un
 *     texte arabe indique la mauvaise direction ;
 *  3. le seul `left-1/2` toléré est le **centrage** d'un dialogue, où la
 *     symétrie rend la classe logique fausse.
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const CSS = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'dist', 'www'].includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.tsx$/.test(entry)) acc.push(full);
  }
  return acc;
}

const sources = [...walk(join(root, 'app')), ...walk(join(root, 'src'))].map((path) => ({
  path: relative(root, path),
  text: readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
}));

describe('G05 — sens d’écriture', () => {
  it('aucune classe directionnelle physique dans les écrans', () => {
    const offenders: string[] = [];
    for (const { path, text } of sources) {
      text.split('\n').forEach((line, index) => {
        // `left-1/2` + `-translate-x-1/2` est un centrage : symétrique, donc
        // identique dans les deux sens. C'est le seul cas toléré.
        const cleaned = line.replace(/\b(left|right)-\[?1\/2/g, '');
        for (const match of cleaned.matchAll(/\b(pl|pr|ml|mr|left|right)-\[?[0-9.]+/g)) {
          offenders.push(`${path}:${index + 1} → ${match[0]}`);
        }
        // L'alignement et l'auto-marge figent aussi un côté.
        for (const match of cleaned.matchAll(/(?<![\w-])(text-left|text-right|ml-auto|mr-auto)\b/g)) {
          offenders.push(`${path}:${index + 1} → ${match[0]}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('miroite les icônes directionnelles en RTL', () => {
    expect(CSS).toMatch(/\[dir=['"]rtl['"]\]\s*\.directional/);
    const marked = sources.flatMap(({ path, text }) =>
      [...text.matchAll(/className="directional\b/g)].map(() => path),
    );
    // Les chevrons de liste et les flèches de progression sont les cas les
    // plus nombreux de l'app ; s'il n'en reste aucun, la classe est morte.
    expect(marked.length).toBeGreaterThan(40);
  });

  it('le lien d’évitement s’ancre au bord logique, pas au bord gauche', () => {
    const skip = CSS.slice(CSS.indexOf('.skip-link {'));
    expect(skip.slice(0, 400)).toMatch(/inset-inline-start:\s*8px/);
    expect(skip.slice(0, 400)).not.toMatch(/\bleft:\s*8px/);
  });

  it('le centrage du dialogue reste physique et documenté', () => {
    const dialog = readFileSync(join(root, 'src/components/ui/dialog.tsx'), 'utf8');
    expect(dialog).toMatch(/left-1\/2/);
    expect(dialog).toMatch(/symétrique|symetrique/);
  });
});
