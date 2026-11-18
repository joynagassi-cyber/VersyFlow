import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APP_ICONS,
  APP_ICON_FAMILIES,
  DEFAULT_APP_ICON_ID,
  applyAppIcon,
  findAppIcon,
  getAppIconUrl,
} from '@/theme/app-icons';

const root = process.cwd();

describe("catalogue d'icônes d'application (33 variantes)", () => {
  it('déclare 33 icônes uniques réparties en 8 collections thématiques', () => {
    expect(APP_ICONS).toHaveLength(33);
    expect(APP_ICON_FAMILIES).toHaveLength(8);
    expect(new Set(APP_ICONS.map((i) => i.id)).size).toBe(33);
    expect(new Set(APP_ICONS.map((i) => i.androidAlias)).size).toBe(33);

    expect(APP_ICONS.filter((i) => i.family === 'engraved')).toHaveLength(5);
    expect(APP_ICONS.filter((i) => i.family === 'atelier')).toHaveLength(4);
    for (const family of APP_ICON_FAMILIES) {
      const count = APP_ICONS.filter((icon) => icon.family === family.id).length;
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  it('associe chaque entrée à un fichier PNG 1024×1024 existant sur disque', () => {
    for (const entry of APP_ICONS) {
      const fullPath = join(root, 'public', 'icons', 'app-icons', entry.file);
      expect(existsSync(fullPath)).toBe(true);
      const buf = readFileSync(fullPath);
      // En-tête PNG + dimensions IHDR 1024×1024
      expect(buf.subarray(0, 4).toString('hex')).toBe('89504e47');
      expect(buf.readUInt32BE(16)).toBe(1024);
      expect(buf.readUInt32BE(20)).toBe(1024);
    }
  });

  it("distingue l'icône gratuite par défaut, les 4 saisonnières offertes et les 28 éditions Collection", () => {
    expect(findAppIcon(DEFAULT_APP_ICON_ID).tier).toBe('free');
    expect(APP_ICONS.filter((i) => i.tier === 'free')).toHaveLength(1);
    expect(APP_ICONS.filter((i) => i.tier === 'seasonal')).toHaveLength(4);
    expect(APP_ICONS.filter((i) => i.tier === 'premium')).toHaveLength(28);
  });

  it('met à jour dynamiquement le favicon du document sur le web et le bureau', async () => {
    document.head.innerHTML = '<link rel="icon" href="/icons/versyflow_icon.png" />';
    await applyAppIcon('25-grave-bible');
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    expect(link?.getAttribute('href')).toBe(getAppIconUrl('25-grave-bible'));
  });
});
