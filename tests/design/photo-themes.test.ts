/**
 * Thèmes photo (lot « 40 images ») — contrat de fichiers et d'intégration.
 *
 * Ces tests décrivent l'état **réel** : tant que `photo-themes.generated.ts`
 * est vide, aucune catégorie photo n'est exposée et le catalogue reste
 * strictement celui des 100 illustrations. Dès que le lot est importé, les
 * mêmes tests vérifient chaque fichier sur disque (dimensions, format,
 * poids, paysage ≠ portrait) et l'alignement du fichier généré.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  ALL_THEMES,
  THEME_CATEGORIES,
  themeLandscapeUrl,
  themePortraitUrl,
  themeThumbUrl,
} from '@/theme/theme-catalog';
import { PHOTO_THEMES } from '@/theme/photo-themes.generated';
import { PHOTO_THEME_COUNT, buildPhotoCategories } from '@/theme/photo-themes';
import { PHOTO_SCENES, buildPrompt } from '../../scripts/themes/photo-scenes.mjs';

const root = join(__dirname, '..', '..');
const publicDir = join(root, 'public', 'themes');

/* ------------------------- lecture des dimensions ------------------------ */

/** Dimensions d'un PNG (IHDR) ou d'un WebP (VP8X / VP8 / VP8L). */
function imageSize(file: string): { w: number; h: number } {
  const d = readFileSync(file);
  if (d.toString('ascii', 1, 4) === 'PNG') return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
  if (d.toString('ascii', 0, 4) !== 'RIFF' || d.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`format non reconnu : ${file}`);
  }
  const chunk = d.toString('ascii', 12, 16);
  if (chunk === 'VP8X') {
    return { w: d.readUIntLE(24, 3) + 1, h: d.readUIntLE(27, 3) + 1 };
  }
  if (chunk === 'VP8 ') {
    return { w: d.readUInt16LE(26) & 0x3fff, h: d.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    const b = d.subarray(21, 25);
    return {
      w: 1 + (((b[1] & 0x3f) << 8) | b[0]),
      h: 1 + (((b[3] & 0x0f) << 10) | (b[2] << 2) | ((b[1] & 0xc0) >> 6)),
    };
  }
  throw new Error(`chunk WebP inattendu : ${chunk}`);
}

const sha = (file: string) => createHash('sha1').update(readFileSync(file)).digest('hex');

/* --------------------------------- tests --------------------------------- */

describe('définition des 20 scènes photo', () => {
  it('20 scènes, 10 par catégorie, identifiants uniques', () => {
    expect(PHOTO_SCENES).toHaveLength(20);
    expect(PHOTO_SCENES.filter((s) => s.category === 'photos-nature')).toHaveLength(10);
    expect(PHOTO_SCENES.filter((s) => s.category === 'photos-vie')).toHaveLength(10);
    const ids = PHOTO_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(20);
    expect(ids.every((id) => /^pho-[a-z0-9-]+$/.test(id))).toBe(true);
  });

  it('couvre les quatre scènes imposées', () => {
    const motifs = PHOTO_SCENES.map((s) => `${s.motif} ${s.scene}`.toLowerCase()).join('\n');
    expect(motifs).toContain('feuilles épaisses vert vif superposées');
    expect(motifs).toContain('aurore boréale');
    expect(motifs).toContain('voiture de sport');
    expect(motifs).toContain('football');
  });

  it('réutilise des couleurs déjà présentes dans le catalogue illustré', () => {
    const known = new Set(THEME_CATEGORIES.flatMap((c) => c.themes.map((t) => t.color)));
    for (const scene of PHOTO_SCENES) expect(known.has(scene.color), scene.color).toBe(true);
  });

  it('les prompts interdisent explicitement texte, logo et filigrane', () => {
    for (const scene of PHOTO_SCENES) {
      for (const format of ['landscape', 'portrait'] as const) {
        const prompt = buildPrompt(scene, format);
        expect(prompt).toContain('no text, no logo, no watermark');
        expect(prompt).toContain('no identifiable face in focus');
        expect(prompt).toContain(format === 'landscape' ? '3:2' : '2:3');
      }
      // Les deux cadrages sont décrits séparément : le portrait n'est pas
      // un simple recadrage du paysage.
      expect(buildPrompt(scene, 'landscape')).not.toBe(buildPrompt(scene, 'portrait'));
    }
  });
});

describe('intégration au catalogue de thèmes', () => {
  it('expose une catégorie photo par scène réellement importée, et rien de plus', () => {
    const categories = buildPhotoCategories();
    expect(categories.flatMap((c) => c.themes)).toHaveLength(PHOTO_THEME_COUNT);
    for (const c of categories) expect(c.themes.length).toBeGreaterThan(0);
    expect(THEME_CATEGORIES.filter((c) => c.id.startsWith('photos-'))).toHaveLength(
      categories.length,
    );
    expect(ALL_THEMES).toHaveLength(100 + PHOTO_THEME_COUNT);
  });

  it('état actuel : aucune catégorie photo tant qu’aucun fichier n’est livré', () => {
    // Si ce test échoue, c'est que le lot a été importé : mettre à jour
    // tests/design/appearance-background.test.ts (100 → 100 + PHOTO_THEME_COUNT).
    if (PHOTO_THEME_COUNT === 0) {
      expect(THEME_CATEGORIES.some((c) => c.id.startsWith('photos-'))).toBe(false);
      expect(ALL_THEMES).toHaveLength(100);
    }
  });

  it('construit des URL cohérentes avec le format réel', () => {
    for (const theme of PHOTO_THEMES) {
      expect(themePortraitUrl(theme.id)).toBe(
        `/themes/${theme.category}/${theme.id}-portrait.${theme.ext}`,
      );
      expect(themeLandscapeUrl(theme.id)).toBe(
        `/themes/${theme.category}/${theme.id}-landscape.${theme.ext}`,
      );
      expect(themeThumbUrl(theme.id)).toBe(`/themes/${theme.category}/${theme.id}-thumb.webp`);
    }
    // Les illustrations conservent leur PNG et leur vignette WebP.
    expect(themePortraitUrl('nat-trees')).toBe('/themes/natures/nat-trees-portrait.png');
    expect(themeThumbUrl('nat-trees')).toBe('/themes/natures/nat-trees-thumb.webp');
  });
});

describe('fichiers livrés', () => {
  it.skipIf(PHOTO_THEME_COUNT === 0)('chaque scène a portrait, paysage et vignette conformes', () => {
    for (const theme of PHOTO_THEMES) {
      const base = join(publicDir, theme.category);
      const files = {
        portrait: join(base, `${theme.id}-portrait.${theme.ext}`),
        landscape: join(base, `${theme.id}-landscape.${theme.ext}`),
        thumb: join(base, `${theme.id}-thumb.webp`),
      };
      for (const [kind, file] of Object.entries(files)) {
        expect(existsSync(file), `${kind} manquant : ${file}`).toBe(true);
      }
      expect(imageSize(files.portrait)).toEqual({ w: 832, h: 1248 });
      expect(imageSize(files.landscape)).toEqual({ w: 1248, h: 832 });
      expect(imageSize(files.thumb).w).toBe(320);

      // Pas de vignette géante ni d'image minuscule agrandie.
      expect(statSync(files.portrait).size).toBeLessThan(900 * 1024);
      expect(statSync(files.landscape).size).toBeLessThan(900 * 1024);
      expect(statSync(files.thumb).size).toBeLessThan(60 * 1024);

      // Deux cadrages distincts, pas une copie.
      expect(sha(files.portrait)).not.toBe(sha(files.landscape));
    }
  });

  it('le fichier généré est aligné sur les fichiers présents', () => {
    expect(() =>
      execFileSync(process.execPath, ['scripts/themes/import-photo-themes.mjs', '--check'], {
        cwd: root,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });
});
