/**
 * Thèmes chrétiens & d'architecture sacrée — contrat de fichiers, d'intégration et d'i18n.
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
import { PHOTO_THEME_COUNT } from '@/theme/photo-themes';
import { SACRED_THEMES } from '@/theme/sacred-themes.generated';
import { SACRED_THEME_COUNT, buildSacredCategories } from '@/theme/sacred-themes';
import { fr } from '@/i18n/locales/fr';
import { en } from '@/i18n/locales/en';
import { SACRED_SCENES, buildSacredPrompt } from '../../scripts/themes/sacred-scenes.mjs';

const root = join(__dirname, '..', '..');
const publicDir = join(root, 'public', 'themes');

function webpSize(file: string): { w: number; h: number } {
  const d = readFileSync(file);
  if (d.toString('ascii', 0, 4) !== 'RIFF' || d.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`format WebP attendu : ${file}`);
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

describe('collections chrétiennes & architecture sacrée', () => {
  it('définit 13 scènes (5 Foi & Victoire + 8 Architecture & Sanctuaires), dont la Victoire à la Croix', () => {
    expect(SACRED_SCENES).toHaveLength(13);
    expect(SACRED_SCENES.filter((s) => s.category === 'foi-victoire')).toHaveLength(5);
    expect(SACRED_SCENES.filter((s) => s.category === 'architecture-sacree')).toHaveLength(8);
    expect(SACRED_SCENES[0].id).toBe('chr-victoire-croix');
    expect(SACRED_SCENES[0].name).toBe('Victoire à la Croix');
  });

  it('place Foi & Victoire et Architecture & Sanctuaires en tête du sélecteur', () => {
    const sacred = buildSacredCategories();
    expect(sacred).toHaveLength(2);
    expect(THEME_CATEGORIES[0].id).toBe('foi-victoire');
    expect(THEME_CATEGORIES[1].id).toBe('architecture-sacree');
    expect(ALL_THEMES).toHaveLength(100 + PHOTO_THEME_COUNT + SACRED_THEME_COUNT);
  });

  it('réutilise exclusivement les couleurs de jetons existantes du catalogue de base', () => {
    const baseColors = new Set(
      THEME_CATEGORIES.filter(
        (c) =>
          !c.id.startsWith('photos-') &&
          c.id !== 'foi-victoire' &&
          c.id !== 'architecture-sacree',
      ).flatMap((c) => c.themes.map((t) => t.color)),
    );
    for (const scene of SACRED_SCENES) {
      expect(baseColors.has(scene.color), `${scene.id} -> ${scene.color}`).toBe(true);
    }
  });

  it('traduit chaque catégorie et chaque scène sacrée en français et en anglais', () => {
    const frEditor = fr.appearanceEditor as Record<string, string>;
    const enEditor = en.appearanceEditor as Record<string, string>;
    expect(frEditor['cat_foi-victoire']).toBe('Foi & Victoire');
    expect(enEditor['cat_foi-victoire']).toBe('Faith & Victory');
    expect(frEditor['cat_architecture-sacree']).toBe('Architecture & Sanctuaires');
    expect(enEditor['cat_architecture-sacree']).toBe('Sacred Architecture');
    for (const scene of SACRED_SCENES) {
      expect(frEditor[`theme_${scene.id}`]).toBeTruthy();
      expect(enEditor[`theme_${scene.id}`]).toBeTruthy();
      expect(buildSacredPrompt(scene, 'landscape')).toContain('3:2');
      expect(buildSacredPrompt(scene, 'portrait')).toContain('2:3');
    }
  });

  it('livre chaque visuel en 1248×832 (paysage), 832×1248 (portrait) et 320w (vignette), distincts', () => {
    expect(SACRED_THEME_COUNT).toBe(13);
    for (const theme of SACRED_THEMES) {
      const base = join(publicDir, theme.category);
      const portrait = join(base, `${theme.id}-portrait.${theme.ext}`);
      const landscape = join(base, `${theme.id}-landscape.${theme.ext}`);
      const thumb = join(base, `${theme.id}-thumb.webp`);

      expect(existsSync(portrait), portrait).toBe(true);
      expect(existsSync(landscape), landscape).toBe(true);
      expect(existsSync(thumb), thumb).toBe(true);

      expect(webpSize(portrait)).toEqual({ w: 832, h: 1248 });
      expect(webpSize(landscape)).toEqual({ w: 1248, h: 832 });
      expect(webpSize(thumb).w).toBe(320);

      expect(statSync(portrait).size).toBeLessThan(900 * 1024);
      expect(statSync(landscape).size).toBeLessThan(900 * 1024);
      expect(statSync(thumb).size).toBeLessThan(60 * 1024);
      expect(sha(portrait)).not.toBe(sha(landscape));

      expect(themePortraitUrl(theme.id)).toBe(
        `/themes/${theme.category}/${theme.id}-portrait.webp`,
      );
      expect(themeLandscapeUrl(theme.id)).toBe(
        `/themes/${theme.category}/${theme.id}-landscape.webp`,
      );
      expect(themeThumbUrl(theme.id)).toBe(`/themes/${theme.category}/${theme.id}-thumb.webp`);
    }
  });

  it('passe le contrôle de synchronisation disque <-> fichier généré', () => {
    const out = execFileSync(process.execPath, ['scripts/themes/import-sacred-themes.mjs', '--check'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(out).toContain('OK — 13 scène(s) sacrée(s)');
  });
});
