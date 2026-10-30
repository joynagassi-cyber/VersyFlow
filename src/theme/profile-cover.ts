import { ALL_THEMES, themeLandscapeUrl } from '@/theme/theme-catalog';

/** Choose the closest locally shipped illustration to the average photo colour.
 * The photo is decoded on-device; no image or colour leaves the browser. */
export async function localProfileCover(photo: string): Promise<string | null> {
  if (!photo.startsWith('data:image/') && !photo.startsWith('blob:')) return null;
  try {
    const image = new Image();
    image.src = photo;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 24;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, 24, 24);
    const pixels = ctx.getImageData(0, 0, 24, 24).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) continue;
      r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; count += 1;
    }
    if (!count) return null;
    r /= count; g /= count; b /= count;
    const closest = ALL_THEMES.filter((theme) => theme.id !== 'obj-miroir').reduce((best, theme) => {
      const rgb = [1, 3, 5].map((offset) => parseInt(theme.color.slice(offset, offset + 2), 16));
      const distance = 2 * (rgb[0] - r) ** 2 + 4 * (rgb[1] - g) ** 2 + (rgb[2] - b) ** 2;
      return !best || distance < best.distance ? { id: theme.id, distance } : best;
    }, null as { id: string; distance: number } | null);
    return closest ? themeLandscapeUrl(closest.id) : null;
  } catch {
    return null;
  }
}
