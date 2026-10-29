/**
 * L6 — Provenance des visuels : un manifeste qui dit d'où vient chaque image,
 * et un calcul de tonalité qui se prouve sur des pixels.
 *
 * Le décodeur PNG est testé sur une image SYNTHÉTIQUE dont on connaît
 * exactement la couleur : si le calcul est faux, le test tombe. Le manifeste
 * est ensuite confronté au catalogue : 100 thèmes, deux visuels attendus
 * chacun, aucun champ manquant.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
// @ts-expect-error — script ESM sans types : seule la fonction testée est importée.
import { pngMeanColor } from '../../scripts/theme-provenance.mjs';

const root = resolve(__dirname, '../..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'docs/design/theme-provenance.json'), 'utf8'),
) as {
  generator: string;
  model: string;
  licence: string;
  themes: number;
  portraitsPresent: number;
  measuredTones: number;
  missingThemes: string[];
  strays: string[];
  entries: {
    id: string;
    category: string;
    declaredColor: string;
    portrait: { path: string; present: boolean };
    landscape: { path: string; present: boolean };
    measured: string | null;
  }[];
};

/** Construit un PNG RVB 8 bits non entrelacé, couleur unie, avec filtre 0. */
function solidPng(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      raw[rowStart + 1 + x * 3] = r;
      raw[rowStart + 2 + x * 3] = g;
      raw[rowStart + 3 + x * 3] = b;
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); // le décodeur testé n'utilise pas le CRC
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // RVB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('L6 — décodeur de tonalité', () => {
  it('retrouve exactement la couleur d’une image unie', () => {
    const mean = pngMeanColor(solidPng(64, 48, [192, 57, 43]));
    expect(mean).not.toBeNull();
    expect(mean.color).toBe('#c0392b');
    expect(mean.width).toBe(64);
    expect(mean.height).toBe(48);
  });

  it('rejette proprement ce qui n’est pas un PNG 8 bits non entrelacé', () => {
    expect(pngMeanColor(Buffer.from('pas une image'))).toBeNull();
  });
});

describe('L6 — manifeste de provenance', () => {
  it('déclare la source, le modèle et la licence', () => {
    expect(manifest.generator).toBe('scripts/generate-themes.mjs');
    expect(manifest.model).toBe('agnes-image-2.5-flash');
    expect(manifest.licence).toMatch(/aucune image tierce/i);
  });

  it('couvre les 100 thèmes, avec les deux visuels attendus', () => {
    expect(manifest.themes).toBe(100);
    expect(manifest.entries).toHaveLength(100);
    for (const entry of manifest.entries) {
      expect(entry.declaredColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(entry.portrait.path).toBe(
        `/themes/${entry.category}/${entry.id}-portrait.png`,
      );
      expect(entry.landscape.path).toBe(
        `/themes/${entry.category}/${entry.id}-landscape.png`,
      );
    }
  });

  it('les visuels de thèmes sont VERSIONNÉS (ils partent sur main avec le code)', () => {
    const tracked = execFileSync('git', ['ls-files', 'public/themes'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((f) => f.endsWith('.png'));
    // 100 thèmes × 2 formats, moins le seul thème jamais généré (obj-miroir).
    expect(tracked.length).toBe(198);
    expect(tracked.filter((f) => f.includes('-portrait.png')).length).toBeGreaterThanOrEqual(99);
    // Le dossier ne doit plus être ignoré : un visuel ajouté doit pouvoir être versionné.
    let ignored = '';
    try {
      ignored = execFileSync('git', ['check-ignore', 'public/themes/esprit/esprit-feu-portrait.png'], {
        cwd: root,
        encoding: 'utf8',
      });
    } catch {
      ignored = '';
    }
    expect(ignored.trim()).toBe('');
  });

  it('déclare ce qui manque et ce qui est orphelin, sans rien supprimer', () => {
    // Un seul thème du catalogue n'a jamais eu de visuel : « Miroir ».
    expect(manifest.missingThemes).toEqual(['objets/obj-miroir']);
    // Deux fichiers au nom accentué (« obj-clé ») ne correspondent à aucun
    // thème : ils sont signalés, pas effacés.
    expect(manifest.strays).toEqual([
      'objets/obj-clé-landscape.png',
      'objets/obj-clé-portrait.png',
    ]);
  });

  it('ne prétend pas avoir mesuré ce qui est absent du poste', () => {
    const present = manifest.entries.filter((e) => e.portrait.present).length;
    const measured = manifest.entries.filter((e) => e.measured).length;
    expect(manifest.portraitsPresent).toBe(present);
    expect(manifest.measuredTones).toBe(measured);
    // Une image absente n'a pas de tonalité : aucun chiffre inventé.
    expect(measured).toBeLessThanOrEqual(present);
  });
});
