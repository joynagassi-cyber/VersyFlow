import { ALL_THEMES, themeLandscapeUrl } from '@/theme/theme-catalog';

export const PROFILE_COVER_STORAGE_KEY = 'versyflow:profile:cover';

export type RgbTuple = [number, number, number];

export interface LocalProfileCoverSpec {
  /** Couleur unie harmonisée extraite localement de la photo. */
  baseColor: string;
  /** Motif SVG data URL généré localement à partir des teintes de la photo. */
  motifDataUrl: string;
  /** Voile sombre/clair assurant un contraste mesuré >= 4,5:1 pour le nom intégré. */
  overlayScrim: string;
  /** Couleur du nom intégré à la photo (contraste mesuré >= 4,5:1 sur le voile). */
  overlayText: string;
  /** Couleur du sous-titre intégré à la photo (contraste mesuré >= 4,5:1 sur le voile). */
  overlayMuted: string;
  /** Ratio de contraste mesuré (WCAG 2.1) entre `overlayText` et le fond composité. */
  contrastRatio: number;
  /** Thème illustré local le plus proche (compatibilité descendante). */
  fallbackImageUrl: string;
  /** Signature locale de la photo (longueur + extrait) pour invalider le cache. */
  photoSignature: string;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toHex([r, g, b]: RgbTuple): string {
  return `#${[r, g, b]
    .map((v) => clampByte(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

function srgbChannel(v: number): number {
  const c = clampByte(v) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(rgb: RgbTuple): number {
  return (
    0.2126 * srgbChannel(rgb[0]) +
    0.7152 * srgbChannel(rgb[1]) +
    0.0722 * srgbChannel(rgb[2])
  );
}

export function wcagContrast(a: RgbTuple, b: RgbTuple): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return la > lb ? (la + 0.05) / (lb + 0.05) : (lb + 0.05) / (la + 0.05);
}

function mixRgb(a: RgbTuple, b: RgbTuple, weightB: number): RgbTuple {
  const w = Math.max(0, Math.min(1, weightB));
  return [
    clampByte(a[0] * (1 - w) + b[0] * w),
    clampByte(a[1] * (1 - w) + b[1] * w),
    clampByte(a[2] * (1 - w) + b[2] * w),
  ];
}

function signatureForPhoto(photo: string): string {
  const head = photo.slice(0, 48);
  const tail = photo.slice(-48);
  return `${photo.length}:${head}:${tail}`;
}

/**
 * Construit une couverture unie + motif SVG géométrique/organique extrait
 * localement des échantillons RVB d'une photo, avec contrôle de contraste
 * WCAG AA (>= 4,5:1) garanti sur tous les fonds extrêmes.
 */
export function deriveProfileCoverFromSamples(
  samples: RgbTuple[],
  photoSignature = 'sample',
): LocalProfileCoverSpec {
  const safeSamples: RgbTuple[] =
    samples.length > 0 ? samples : [[72, 85, 99]];

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (const [r, g, b] of safeSamples) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  const avg: RgbTuple = [
    clampByte(sumR / safeSamples.length),
    clampByte(sumG / safeSamples.length),
    clampByte(sumB / safeSamples.length),
  ];

  // Échantillons secondaires (haut-gauche / bas-droite) pour nuancer le motif.
  const accentA = mixRgb(safeSamples[0] ?? avg, avg, 0.35);
  const accentB = mixRgb(safeSamples[safeSamples.length - 1] ?? avg, [255, 255, 255], 0.22);

  // Assombrit la base si elle est trop claire pour que le motif reste doux et
  // que le texte superposé conserve un contraste >= 4,5:1 même sur photo blanche.
  const baseDarkened = mixRgb(avg, [18, 20, 26], 0.58);
  const baseHex = toHex(baseDarkened);
  const waveHexA = toHex(mixRgb(accentA, [255, 255, 255], 0.18));
  const waveHexB = toHex(accentB);

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">`,
    `<rect width="800" height="400" fill="${baseHex}"/>`,
    `<circle cx="660" cy="78" r="190" fill="${waveHexA}" fill-opacity="0.24"/>`,
    `<circle cx="130" cy="330" r="220" fill="${waveHexB}" fill-opacity="0.18"/>`,
    `<path d="M0 250 C 210 180, 420 320, 800 205 L 800 400 L 0 400 Z" fill="${waveHexA}" fill-opacity="0.22"/>`,
    `<path d="M0 305 C 260 250, 510 355, 800 275 L 800 400 L 0 400 Z" fill="${waveHexB}" fill-opacity="0.16"/>`,
    `</svg>`,
  ].join('');
  const motifDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  // Voile de bas de photo à 84 % d'opacité sombre teintée par la photo :
  // même sur une photo 100 % blanche (#ffffff), le fond composité vaut au plus
  // mix([255,255,255], scrimSolid, 0.84) → contraste > 8:1 avec #f8fafc / #e2e8f0.
  const scrimSolid = mixRgb(avg, [12, 12, 16], 0.86);
  const worstBackdrop = mixRgb([255, 255, 255], scrimSolid, 0.84);
  const textRgb: RgbTuple = [248, 250, 252];
  const mutedRgb: RgbTuple = [226, 232, 240];
  const measuredMuted = wcagContrast(mutedRgb, worstBackdrop);
  const measuredText = wcagContrast(textRgb, worstBackdrop);

  const closest = ALL_THEMES.filter((theme) => theme.id !== 'obj-miroir').reduce(
    (best, theme) => {
      const rgb = [1, 3, 5].map((offset) =>
        parseInt(theme.color.slice(offset, offset + 2), 16),
      );
      const distance =
        2 * (rgb[0] - avg[0]) ** 2 +
        4 * (rgb[1] - avg[1]) ** 2 +
        (rgb[2] - avg[2]) ** 2;
      return !best || distance < best.distance ? { id: theme.id, distance } : best;
    },
    null as { id: string; distance: number } | null,
  );

  return {
    baseColor: baseHex,
    motifDataUrl,
    overlayScrim: `rgba(${scrimSolid[0]}, ${scrimSolid[1]}, ${scrimSolid[2]}, 0.84)`,
    overlayText: toHex(textRgb),
    overlayMuted: toHex(mutedRgb),
    contrastRatio: Math.min(measuredText, measuredMuted),
    fallbackImageUrl: themeLandscapeUrl(closest?.id ?? 'nat-trees'),
    photoSignature,
  };
}

export function readPersistedProfileCover(photo: string): LocalProfileCoverSpec | null {
  if (!photo) return null;
  try {
    const raw = localStorage.getItem(PROFILE_COVER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalProfileCoverSpec;
    if (
      parsed &&
      parsed.photoSignature === signatureForPhoto(photo) &&
      typeof parsed.motifDataUrl === 'string' &&
      parsed.contrastRatio >= 4.5
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Décode la photo sur l'appareil (aucun appel réseau), extrait localement un
 * motif harmonisé + voile contrasté, et persiste le résultat dans le stockage
 * local (automatiquement isolé en mode démo).
 */
export async function resolveAndPersistProfileCover(
  photo: string,
): Promise<LocalProfileCoverSpec | null> {
  if (!photo || (!photo.startsWith('data:image/') && !photo.startsWith('blob:'))) {
    try {
      localStorage.removeItem(PROFILE_COVER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }

  const cached = readPersistedProfileCover(photo);
  if (cached) return cached;

  try {
    const image = new Image();
    image.src = photo;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, 16, 16);
    const pixels = ctx.getImageData(0, 0, 16, 16).data;
    const samples: RgbTuple[] = [];
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i + 3] < 128) continue;
      samples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
    if (samples.length === 0) return null;
    const spec = deriveProfileCoverFromSamples(samples, signatureForPhoto(photo));
    try {
      localStorage.setItem(PROFILE_COVER_STORAGE_KEY, JSON.stringify(spec));
    } catch {
      /* ignore quota */
    }
    return spec;
  } catch {
    return null;
  }
}

/** Compatibilité : renvoie l'URL du motif local extrait de la photo (ou null). */
export async function localProfileCover(photo: string): Promise<string | null> {
  const spec = await resolveAndPersistProfileCover(photo);
  return spec?.motifDataUrl ?? null;
}
