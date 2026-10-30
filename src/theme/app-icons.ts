/**
 * App Icon Catalog — 33 expressive VersyFlow launcher & favicon icons across 8 collections.
 *
 * Each icon is a distinct miniature world, material sculpture, or intaglio carving built around
 * the locked VersyFlow winged-V + hollow open-book + heart silhouette:
 *  - 'free'     : Default signature icon (#01 Rose Origine)
 *  - 'seasonal' : 4 Free seasonal / liturgical gift editions (#21–#24)
 *  - 'premium'  : 28 Collectible expressive, engraved & atelier editions (#02–#20, #25–#33)
 */

import { Capacitor } from '@capacitor/core';

export type AppIconTier = 'free' | 'seasonal' | 'premium';

export type AppIconFamilyId =
  | 'playful'
  | 'engraved'
  | 'atelier'
  | 'retroTech'
  | 'cosmos'
  | 'sanctuary'
  | 'illustrated'
  | 'seasonal';

export interface AppIconEntry {
  id: string;
  name: string;
  family: AppIconFamilyId;
  tier: AppIconTier;
  file: string;
  /** iOS alternate icon key (CFBundleAlternateIcons), null for primary bundle icon. */
  iosIconName: string | null;
  /** Android <activity-alias> suffix in AndroidManifest.xml. */
  androidAlias: string;
}

export interface AppIconFamily {
  id: AppIconFamilyId;
  labelKey: string;
  defaultLabel: string;
}

export const DEFAULT_APP_ICON_ID = '01-rose-origine';

export const APP_ICON_FAMILIES: AppIconFamily[] = [
  { id: 'playful', labelKey: 'settings.iconFamilies.playful', defaultLabel: 'Pop, 3D & Mascotte' },
  { id: 'engraved', labelKey: 'settings.iconFamilies.engraved', defaultLabel: 'Gravé dans la Création' },
  { id: 'atelier', labelKey: 'settings.iconFamilies.atelier', defaultLabel: 'Atelier, Pierre & Couture' },
  { id: 'retroTech', labelKey: 'settings.iconFamilies.retroTech', defaultLabel: 'Rétro, Méca & Cyber-HUD' },
  { id: 'cosmos', labelKey: 'settings.iconFamilies.cosmos', defaultLabel: 'Cosmos, Lune & Vitrail' },
  { id: 'sanctuary', labelKey: 'settings.iconFamilies.sanctuary', defaultLabel: 'Trésors, Cire & Arcade' },
  { id: 'illustrated', labelKey: 'settings.iconFamilies.illustrated', defaultLabel: 'Mondes Illustrés & Papier 3D' },
  { id: 'seasonal', labelKey: 'settings.iconFamilies.seasonal', defaultLabel: 'Temps Forts & Saisons' },
];

export const APP_ICONS: AppIconEntry[] = [
  // Famille 1 — Pop, 3D & Mascotte
  {
    id: '01-rose-origine',
    name: 'Rose Origine',
    family: 'playful',
    tier: 'free',
    file: '01-rose-origine.png',
    iosIconName: null,
    androidAlias: '.MainActivityDefault',
  },
  {
    id: '02-bulle-candy-3d',
    name: 'Bulle Candy 3D',
    family: 'playful',
    tier: 'premium',
    file: '02-bulle-candy-3d.png',
    iosIconName: 'AppIconBulleCandy3D',
    androidAlias: '.MainActivityBulleCandy3D',
  },
  {
    id: '03-mascotte-regard',
    name: 'Mascotte Compagnon',
    family: 'playful',
    tier: 'premium',
    file: '03-mascotte-regard.png',
    iosIconName: 'AppIconMascotteRegard',
    androidAlias: '.MainActivityMascotteRegard',
  },
  {
    id: '04-prisme-neon',
    name: 'Prisme Néon',
    family: 'playful',
    tier: 'premium',
    file: '04-prisme-neon.png',
    iosIconName: 'AppIconPrismeNeon',
    androidAlias: '.MainActivityPrismeNeon',
  },

  // Famille 2 — Rétro, Méca & Cyber-HUD
  {
    id: '05-terminal-crt-1984',
    name: 'Terminal Rétro 1984',
    family: 'retroTech',
    tier: 'premium',
    file: '05-terminal-crt-1984.png',
    iosIconName: 'AppIconTerminalCRT1984',
    androidAlias: '.MainActivityTerminalCRT1984',
  },
  {
    id: '06-coffre-titane',
    name: 'Coffre Mécanique Titane',
    family: 'retroTech',
    tier: 'premium',
    file: '06-coffre-titane.png',
    iosIconName: 'AppIconCoffreTitane',
    androidAlias: '.MainActivityCoffreTitane',
  },
  {
    id: '07-reacteur-hud',
    name: 'Réacteur Cyber-HUD',
    family: 'retroTech',
    tier: 'premium',
    file: '07-reacteur-hud.png',
    iosIconName: 'AppIconReacteurHUD',
    androidAlias: '.MainActivityReacteurHUD',
  },
  {
    id: '08-eclipse-diamant',
    name: 'Éclipse Diamant',
    family: 'retroTech',
    tier: 'premium',
    file: '08-eclipse-diamant.png',
    iosIconName: 'AppIconEclipseDiamant',
    androidAlias: '.MainActivityEclipseDiamant',
  },

  // Famille 3 — Cosmos, Lune & Vitrail
  {
    id: '09-cosmos-cometes',
    name: 'Cosmos & Comètes',
    family: 'cosmos',
    tier: 'premium',
    file: '09-cosmos-cometes.png',
    iosIconName: 'AppIconCosmosCometes',
    androidAlias: '.MainActivityCosmosCometes',
  },
  {
    id: '10-lune-monochrome',
    name: 'Lune Cratérisée 3D',
    family: 'cosmos',
    tier: 'premium',
    file: '10-lune-monochrome.png',
    iosIconName: 'AppIconLuneMonochrome',
    androidAlias: '.MainActivityLuneMonochrome',
  },
  {
    id: '11-fil-argent-oled',
    name: "Fil d'Argent OLED",
    family: 'cosmos',
    tier: 'premium',
    file: '11-fil-argent-oled.png',
    iosIconName: 'AppIconFilArgentOLED',
    androidAlias: '.MainActivityFilArgentOLED',
  },
  {
    id: '12-vitrail-cathedrale',
    name: 'Vitrail de Cathédrale',
    family: 'cosmos',
    tier: 'premium',
    file: '12-vitrail-cathedrale.png',
    iosIconName: 'AppIconVitrailCathedrale',
    androidAlias: '.MainActivityVitrailCathedrale',
  },

  // Famille 4 — Trésors, Cire & Arcade
  {
    id: '13-sceau-cire-royale',
    name: 'Sceau de Cire Royale',
    family: 'sanctuary',
    tier: 'premium',
    file: '13-sceau-cire-royale.png',
    iosIconName: 'AppIconSceauCireRoyale',
    androidAlias: '.MainActivitySceauCireRoyale',
  },
  {
    id: '14-reliure-cuir-or',
    name: 'Reliure Cuir & Or 24k',
    family: 'sanctuary',
    tier: 'premium',
    file: '14-reliure-cuir-or.png',
    iosIconName: 'AppIconReliureCuirOr',
    androidAlias: '.MainActivityReliureCuirOr',
  },
  {
    id: '15-astrolabe-celeste',
    name: 'Astrolabe Céleste',
    family: 'sanctuary',
    tier: 'premium',
    file: '15-astrolabe-celeste.png',
    iosIconName: 'AppIconAstrolabeCeleste',
    androidAlias: '.MainActivityAstrolabeCeleste',
  },
  {
    id: '16-pixel-arcade-16bit',
    name: 'Pixel Arcade 16-Bit',
    family: 'sanctuary',
    tier: 'premium',
    file: '16-pixel-arcade-16bit.png',
    iosIconName: 'AppIconPixelArcade16Bit',
    androidAlias: '.MainActivityPixelArcade16Bit',
  },

  // Famille 5 — Mondes Illustrés & Papier 3D
  {
    id: '17-grande-vague-ocean',
    name: "Grande Vague d'Eau Vive",
    family: 'illustrated',
    tier: 'premium',
    file: '17-grande-vague-ocean.png',
    iosIconName: 'AppIconGrandeVagueOcean',
    androidAlias: '.MainActivityGrandeVagueOcean',
  },
  {
    id: '18-vallee-montagnes-aube',
    name: "Vallée de l'Aube",
    family: 'illustrated',
    tier: 'premium',
    file: '18-vallee-montagnes-aube.png',
    iosIconName: 'AppIconValleeMontagnesAube',
    androidAlias: '.MainActivityValleeMontagnesAube',
  },
  {
    id: '19-couronne-olivier',
    name: "Couronne d'Olivier",
    family: 'illustrated',
    tier: 'premium',
    file: '19-couronne-olivier.png',
    iosIconName: 'AppIconCouronneOlivier',
    androidAlias: '.MainActivityCouronneOlivier',
  },
  {
    id: '20-diorama-papier-3d',
    name: 'Diorama Papier 3D',
    family: 'illustrated',
    tier: 'premium',
    file: '20-diorama-papier-3d.png',
    iosIconName: 'AppIconDioramaPapier3D',
    androidAlias: '.MainActivityDioramaPapier3D',
  },

  // Famille 6 — Temps Forts & Saisons (Free seasonal gifts!)
  {
    id: '21-noel-couronne-houx',
    name: 'Noël — Couronne de Houx',
    family: 'seasonal',
    tier: 'seasonal',
    file: '21-noel-couronne-houx.png',
    iosIconName: 'AppIconNoelCouronneHoux',
    androidAlias: '.MainActivityNoelCouronneHoux',
  },
  {
    id: '22-paques-collines-fleurs',
    name: 'Pâques — Aube Fleurie',
    family: 'seasonal',
    tier: 'seasonal',
    file: '22-paques-collines-fleurs.png',
    iosIconName: 'AppIconPaquesCollinesFleurs',
    androidAlias: '.MainActivityPaquesCollinesFleurs',
  },
  {
    id: '23-fete-lanternes-or',
    name: 'Fête — Lanternes & Étincelles',
    family: 'seasonal',
    tier: 'seasonal',
    file: '23-fete-lanternes-or.png',
    iosIconName: 'AppIconFeteLanternesOr',
    androidAlias: '.MainActivityFeteLanternesOr',
  },
  {
    id: '24-nuit-etoile-bethleem',
    name: 'Nuit de Bethléem',
    family: 'seasonal',
    tier: 'seasonal',
    file: '24-nuit-etoile-bethleem.png',
    iosIconName: 'AppIconNuitEtoileBethleem',
    androidAlias: '.MainActivityNuitEtoileBethleem',
  },

  // Famille 7 — Gravé dans la Création (5 intaglio / parted-matter editions!)
  {
    id: '25-grave-bible',
    name: 'Gravé dans la Bible',
    family: 'engraved',
    tier: 'premium',
    file: '25-grave-bible.png',
    iosIconName: 'AppIconGraveBible',
    androidAlias: '.MainActivityGraveBible',
  },
  {
    id: '26-grave-arbre',
    name: "Gravé dans l'Arbre",
    family: 'engraved',
    tier: 'premium',
    file: '26-grave-arbre.png',
    iosIconName: 'AppIconGraveArbre',
    androidAlias: '.MainActivityGraveArbre',
  },
  {
    id: '27-grave-nuages',
    name: 'Gravé dans les Nuages',
    family: 'engraved',
    tier: 'premium',
    file: '27-grave-nuages.png',
    iosIconName: 'AppIconGraveNuages',
    androidAlias: '.MainActivityGraveNuages',
  },
  {
    id: '28-grave-terre',
    name: 'Gravé dans la Terre',
    family: 'engraved',
    tier: 'premium',
    file: '28-grave-terre.png',
    iosIconName: 'AppIconGraveTerre',
    androidAlias: '.MainActivityGraveTerre',
  },
  {
    id: '29-grave-mer',
    name: 'Gravé dans la Mer',
    family: 'engraved',
    tier: 'premium',
    file: '29-grave-mer.png',
    iosIconName: 'AppIconGraveMer',
    androidAlias: '.MainActivityGraveMer',
  },

  // Famille 8 — Atelier, Pierre & Couture (4 signature material & artistic editions!)
  {
    id: '30-edition-feminine',
    name: 'Édition Féminine Nacre',
    family: 'atelier',
    tier: 'premium',
    file: '30-edition-feminine.png',
    iosIconName: 'AppIconEditionFeminine',
    androidAlias: '.MainActivityEditionFeminine',
  },
  {
    id: '31-edition-minimaliste',
    name: 'Minimaliste Architectural',
    family: 'atelier',
    tier: 'premium',
    file: '31-edition-minimaliste.png',
    iosIconName: 'AppIconEditionMinimaliste',
    androidAlias: '.MainActivityEditionMinimaliste',
  },
  {
    id: '32-pierre-taillee',
    name: 'Pierre Taillée Assemblée',
    family: 'atelier',
    tier: 'premium',
    file: '32-pierre-taillee.png',
    iosIconName: 'AppIconPierreTaillee',
    androidAlias: '.MainActivityPierreTaillee',
  },
  {
    id: '33-style-artistique',
    name: 'Toile Impasto Artistique',
    family: 'atelier',
    tier: 'premium',
    file: '33-style-artistique.png',
    iosIconName: 'AppIconStyleArtistique',
    androidAlias: '.MainActivityStyleArtistique',
  },
];

export function findAppIcon(id: string | null | undefined): AppIconEntry {
  if (!id) return APP_ICONS[0];
  return APP_ICONS.find((entry) => entry.id === id) ?? APP_ICONS[0];
}

export function getAppIconUrl(id: string | null | undefined): string {
  const entry = findAppIcon(id);
  return `/icons/app-icons/${entry.file}`;
}

interface NativeAppIconBridge {
  change?: (options: { name: string; suppressNotification?: boolean; disable?: string[] }) => Promise<void>;
  reset?: (options?: { suppressNotification?: boolean; disable?: string[] }) => Promise<void>;
}

/**
 * Applies the selected app icon across platforms:
 *  - Web / Desktop browser: updates `<link rel="icon">` & `<link rel="apple-touch-icon">` live.
 *  - Mobile (Capacitor iOS / Android): invokes native AppIcon plugin bridge when installed.
 */
export async function applyAppIcon(id: string | null | undefined): Promise<void> {
  const entry = findAppIcon(id);
  const href = getAppIconUrl(entry.id);

  if (typeof document !== 'undefined') {
    const selectors = ["link[rel='icon']", "link[rel='shortcut icon']", "link[rel='apple-touch-icon']"];
    const links = document.querySelectorAll<HTMLLinkElement>(selectors.join(', '));
    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = href;
      document.head.appendChild(link);
    } else {
      links.forEach((link) => {
        link.type = 'image/png';
        link.href = href;
      });
    }
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const plugins = (
        globalThis as unknown as { Capacitor?: { Plugins?: { AppIcon?: NativeAppIconBridge } } }
      ).Capacitor?.Plugins;
      const bridge = plugins?.AppIcon;
      if (!bridge) return;

      const platform = Capacitor.getPlatform();
      if (platform === 'ios') {
        if (entry.iosIconName == null) {
          await bridge.reset?.({ suppressNotification: false });
        } else {
          await bridge.change?.({ name: entry.iosIconName, suppressNotification: false });
        }
      } else if (platform === 'android') {
        const others = APP_ICONS.filter((item) => item.id !== entry.id).map((item) => item.androidAlias);
        await bridge.change?.({ name: entry.androidAlias, disable: others });
      }
    } catch {
      /* Native plugin optional until native rebuild — web & UI state remain synced */
    }
  }
}
