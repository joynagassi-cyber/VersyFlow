/**
 * L4 — Une seule échelle d'élévation, une échelle typographique explicite.
 *
 * Le contrôle lit la configuration qui sera réellement compilée : il ne teste
 * pas une intention, il teste l'objet `theme.extend` livré. Trois choses sont
 * vérifiées :
 *
 *  1. `boxShadow` n'est déclaré qu'UNE fois. Un doublon de clé en JavaScript
 *     n'est pas une erreur : la seconde écrase silencieusement la première, et
 *     les jetons de la première disparaissent du CSS produit.
 *  2. Les ombres sont neutres (aucune valeur rgba/hex colorée en dur) et
 *     pointent vers des variables CSS, pour suivre le thème clair/sombre.
 *  3. `fontSize` existe et couvre l'interface ; `maxWidth` expose la mesure de
 *     lecture.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const configSrc = readFileSync(resolve(root, 'tailwind.config.js'), 'utf8');
const globalsSrc = readFileSync(resolve(root, 'src/styles/globals.css'), 'utf8');

/** Extrait le bloc `theme.extend` en suivant les accolades. */
function extractExtend(src: string): string {
  const start = src.indexOf('extend:');
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  let started = false;
  for (let i = start; i < src.length; i += 1) {
    if (src[i] === '{') {
      depth += 1;
      started = true;
    } else if (src[i] === '}') {
      depth -= 1;
      if (started && depth === 0) return src.slice(start, i + 1);
    }
  }
  throw new Error('bloc theme.extend non fermé');
}

const extend = extractExtend(configSrc);

/** Compte les clés de premier niveau d'un sous-bloc, doublons inclus. */
function topLevelKeys(blockName: string): string[] {
  const key = `${blockName}:`;
  const start = extend.indexOf(key);
  if (start === -1) return [];
  const open = extend.indexOf('{', start);
  let depth = 0;
  const keys: string[] = [];
  let token = '';
  for (let i = open; i < extend.length; i += 1) {
    const c = extend[i];
    if (c === '{') {
      depth += 1;
      continue;
    }
    if (c === '}') {
      depth -= 1;
      if (depth === 0) break;
      continue;
    }
    if (depth === 1) {
      if (/[A-Za-z0-9_'-]/.test(c)) token += c;
      else if (c === ':' && token) {
        keys.push(token.replace(/^['"]|['"]$/g, ''));
        token = '';
      } else if (c === ',' || c === '\n') token = '';
    }
  }
  return keys;
}

describe('L4 — élévation', () => {
  it('ne déclare boxShadow qu’une seule fois dans theme.extend', () => {
    const occurrences = extend.match(/\bboxShadow\s*:/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it('expose exactement trois niveaux d’ombre, tous neutres', () => {
    const block = extend.slice(extend.indexOf('boxShadow:'));
    const body = block.slice(0, block.indexOf('},') + 1);

    for (const name of ['card', 'float', 'lift']) {
      expect(body).toMatch(new RegExp(`${name}:\\s*'var\\(--shadow-${name}\\)'`));
    }
    // Aucune teinte en dur : ni rgba(...), ni #hexadécimal dans les ombres.
    expect(body).not.toMatch(/rgba?\(/i);
    expect(body).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('définit les trois variables d’ombre dans le CSS source', () => {
    for (const name of ['card', 'float', 'lift']) {
      expect(globalsSrc).toMatch(new RegExp(`--shadow-${name}\\s*:`));
    }
    // Les ombres dérivent de l'encre du thème, pas d'un gris arbitraire.
    expect(globalsSrc).toMatch(/--shadow-card:[\s\S]{0,400}var\(--color-text-primary\)/);
  });
});

describe('L4 — typographie', () => {
  it('déclare une échelle fontSize explicite', () => {
    const keys = topLevelKeys('fontSize');
    expect(keys.length).toBeGreaterThanOrEqual(10);
    for (const step of ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']) {
      expect(keys).toContain(step);
    }
  });

  it('donne une hauteur de ligne à chaque pas, sans exception', () => {
    const block = extend.slice(extend.indexOf('fontSize:'));
    const body = block.slice(0, block.indexOf('},') + 1);
    const steps = body.match(/\['[0-9]+px',\s*\{\s*lineHeight:\s*'[0-9]+px'\s*\}\]/g) ?? [];
    expect(steps.length).toBe((body.match(/:\s*\['[0-9]+px'/g) ?? []).length);
    expect(steps.length).toBeGreaterThanOrEqual(10);
  });

  it('expose la mesure de lecture comme largeur nommée', () => {
    const keys = topLevelKeys('maxWidth');
    expect(keys).toContain('reading');
    expect(keys).toContain('content');
    expect(globalsSrc).toMatch(/--reading-width\s*:/);
    expect(globalsSrc).toMatch(/--reading-wide\s*:/);
  });
});
