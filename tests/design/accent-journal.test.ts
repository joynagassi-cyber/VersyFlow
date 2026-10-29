/**
 * L9 — Le journal des ajustements d'accent est consultable ET vérifiable.
 *
 * Un ajustement de couleur n'est pas une opinion : il a une source, une paire
 * mesurée, un ratio avant, un ratio après. Ce test relit le journal produit par
 * `node scripts/apply-preset-contrast.mjs` et vérifie trois choses :
 *
 *  1. il couvre les 25 presets, dans les deux modes, sur les 10 paires ;
 *  2. aucune paire livrée n'est sous le seuil AA de 4,5:1 ;
 *  3. le journal correspond au CSS réellement servi (empreinte SHA-256), donc
 *     il ne peut pas vieillir en silence.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const journal = JSON.parse(
  readFileSync(resolve(root, 'docs/design/accent-adjustments.json'), 'utf8'),
) as {
  threshold: number;
  cssSha256: string;
  presets: number;
  pairs: number;
  minimum: number | null;
  belowThreshold: number;
  adjustments: { preset: string; pair: string; from: number; to: number; decision: string }[];
  entries: { preset: string; mode: 'light' | 'dark'; pair: string; fg: string; bg: string; ratio: number; verdict: string }[];
};

const css = readFileSync(resolve(root, 'src/styles/tweakcn-presets.css'), 'utf8');

describe('L9 — journal des accents', () => {
  it('couvre 25 presets × 10 paires × 2 modes', () => {
    expect(journal.threshold).toBe(4.5);
    expect(journal.presets).toBe(25);
    expect(journal.pairs).toBe(500);
    expect(journal.entries).toHaveLength(500);
    const presets = new Set(journal.entries.map((e) => e.preset));
    expect(presets.size).toBe(25);
    expect(new Set(journal.entries.map((e) => e.mode))).toEqual(new Set(['light', 'dark']));
    expect(new Set(journal.entries.map((e) => e.pair)).size).toBe(10);
  });

  it('aucune paire livrée n’est sous 4,5:1', () => {
    const below = journal.entries.filter((e) => e.ratio < journal.threshold);
    expect(below.map((e) => `${e.preset}/${e.mode}/${e.pair}=${e.ratio}`)).toEqual([]);
    expect(journal.belowThreshold).toBe(0);
    expect(journal.minimum).toBeGreaterThanOrEqual(journal.threshold);
  });

  it('un ajustement consigné améliore toujours le contraste', () => {
    for (const a of journal.adjustments) {
      expect(a.from).toBeLessThan(journal.threshold);
      expect(a.to).toBeGreaterThanOrEqual(journal.threshold);
      expect(a.to).toBeGreaterThan(a.from);
      expect(a.decision.length).toBeGreaterThan(0);
    }
  });

  it('le journal correspond au CSS servi (pas de journal périmé)', () => {
    const sha = createHash('sha256').update(css).digest('hex').slice(0, 16);
    expect(journal.cssSha256).toBe(sha);
  });

  it('chaque paire mesurée existe bien dans le CSS du preset', () => {
    for (const entry of journal.entries.slice(0, 50)) {
      expect(css).toContain(`data-preset='${entry.preset}'`);
      expect(css.toLowerCase()).toContain(entry.fg.toLowerCase());
      expect(css.toLowerCase()).toContain(entry.bg.toLowerCase());
    }
  });
});
