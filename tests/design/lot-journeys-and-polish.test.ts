import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PROFILE_COVER_STORAGE_KEY,
  deriveProfileCoverFromSamples,
  readPersistedProfileCover,
  wcagContrast,
  type RgbTuple,
} from '@/theme/profile-cover';
import { formatVerseKey } from '@/hooks/useSemanticTags';
import {
  formatLastSevenDaysAria,
  formatStreakDaysLabel,
  resolveDailyCardVisual,
} from '../../app/(tabs)/index';

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');
const stripCssComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function hexToRgb(hex: string): RgbTuple {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

describe('Lot 2 — Sélecteur de dégradés, mode sombre neutre et garde-fous CSS', () => {
  it('place le nom du dégradé hors de la vignette colorée et expose aria-pressed', () => {
    const appearance = read('app/settings/appearance.tsx');
    expect(appearance).toContain('className="appearance-gradient-option"');
    expect(appearance).toContain('className="appearance-gradient-name"');
    // Le libellé .appearance-gradient-name est placé hors du span vignette .appearance-gradient
    expect(appearance).toMatch(
      /<span[\s\S]*?'appearance-gradient'[\s\S]*?<\/span>\s*<span className="appearance-gradient-name">/,
    );
  });

  it('propage le dégradé actif aux boutons et contrôles actifs au lieu de la teinte unie figée', () => {
    const css = read('src/styles/globals.css');
    expect(css).toContain("html[data-app-bg='gradient']");
    expect(css).toContain('--gradient-action:');
    expect(css).toContain(
      "html[data-app-bg='gradient'] .appearance-segment-button[aria-pressed='true']",
    );
    expect(css).toContain("html[data-app-bg='gradient'] .verse-flow-number.is-selected");
  });

  it('maintient un mode sombre neutre quasi noir sans règle background-attachment: fixed', () => {
    const css = stripCssComments(read('src/styles/globals.css'));
    const gradientsCss = stripCssComments(read('src/styles/gradients.css'));
    expect(css).not.toMatch(/background-attachment\s*:\s*fixed/i);
    expect(gradientsCss).not.toMatch(/background-attachment\s*:\s*fixed/i);
    // Le sombre se vérifie par sa STRUCTURE, pas par un gris précis : il doit
    // déclarer ses triplets dans son propre bloc (surface, fond, verre), et
    // aucun `--glass-rgb` ne doit subsister hors de ces blocs — c'était
    // précisément la valeur figée qui empêchait le verre de suivre un preset.
    const darkBlock = css.slice(css.indexOf(":root[data-theme='dark'], .appearance-preview[data-theme='dark'] {"));
    const darkBody = darkBlock.slice(0, darkBlock.indexOf('\n}'));
    expect(darkBody).toContain('--gc-rgb:');
    expect(darkBody).toContain('--bg-rgb:');
    expect(darkBody).toContain('--glass-rgb:');
    expect(css).not.toMatch(/^:root\[data-theme='dark'\] \{ --glass-rgb:/m);
  });

  it('assure une navigation flottante sans bande réservée tout en dégageant le bas de défilement', () => {
    const css = read('src/styles/globals.css');
    expect(css).toContain('.mobile-content { padding-bottom: 0; }');
    expect(css).toContain(
      '.mobile-content > * { padding-bottom: calc(116px + env(safe-area-inset-bottom, 0px)); }',
    );
    expect(css).toContain('.mobile-tabs.g1, .desktop-rail.g1');
  });
});

describe('Lot 3A — Onboarding complet et retour arrière sûr', () => {
  it('utilise goBackSafely dans FullScreenPage et évite la route 404 /settings', () => {
    const fullScreen = read('src/components/layout/FullScreenPage.tsx');
    expect(fullScreen).toContain("goBackSafely(navigate, backPath ?? '/tabs/home')");

    for (const page of [
      'app/settings/about.tsx',
      'app/settings/backup.tsx',
      'app/settings/data.tsx',
      'app/settings/languages.tsx',
      'app/settings/navigation.tsx',
      'app/settings/privacy.tsx',
      'app/settings/reminders.tsx',
    ]) {
      const src = read(page);
      expect(src).toContain('/tabs/settings');
      expect(src).not.toContain('backPath="/settings"');
    }
  });

  it('aligne les étapes 2 à 6 de l’onboarding sur OnboardingShell avec barre de progression accessible', () => {
    const shell = read('src/components/onboarding/OnboardingShell.tsx');
    expect(shell).toContain('role="progressbar"');
    expect(shell).toContain('useReducedMotion');
    expect(shell).toContain('onClick={onBack}');

    for (const step of [
      'app/onboarding/language-select.tsx',
      'app/onboarding/translation-select.tsx',
      'app/onboarding/session-config.tsx',
      'app/onboarding/reminder-config.tsx',
      'app/onboarding/fsrs-introduction.tsx',
    ]) {
      const src = read(step);
      expect(src).toContain('OnboardingShell');
      expect(src).toContain('onBack=');
    }
  });

  it('préserve le retour arrière hiérarchique sur toutes les pages Bible', () => {
    expect(read('app/bible/explorer.tsx')).toContain('FullScreenPage');
    expect(read('app/bible/book.tsx')).toContain('backPath="/tabs/explore"');
    expect(read('app/bible/chapter.tsx')).toContain('backPath={`/bible/book/${book.id}`}');
  });
});

describe('Lot 3B — Couverture profil locale harmonisée et contraste WCAG AA', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('garantit un contraste >= 4.5:1 sur le texte intégré à la photo (palettes très claires et très sombres)', () => {
    const bright = deriveProfileCoverFromSamples([
      [255, 255, 255],
      [248, 244, 240],
      [236, 224, 212],
    ]);
    const dark = deriveProfileCoverFromSamples([
      [10, 12, 16],
      [24, 28, 36],
      [42, 48, 64],
    ]);

    expect(bright.motifDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(bright.contrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(wcagContrast(hexToRgb(bright.overlayText), hexToRgb(bright.baseColor))).toBeGreaterThanOrEqual(4.5);

    expect(dark.motifDataUrl.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(dark.contrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(wcagContrast(hexToRgb(dark.overlayText), hexToRgb(dark.baseColor))).toBeGreaterThanOrEqual(4.5);
  });

  it('valide la signature locale et rejette les caches corrompus ou insuffisamment contrastés', () => {
    const fakePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const spec = deriveProfileCoverFromSamples(
      [[64, 96, 128]],
      `${fakePhoto.length}:${fakePhoto.slice(0, 48)}:${fakePhoto.slice(-48)}`,
    );
    localStorage.setItem(PROFILE_COVER_STORAGE_KEY, JSON.stringify(spec));
    expect(readPersistedProfileCover(fakePhoto)?.baseColor).toBe(spec.baseColor);
    expect(readPersistedProfileCover('data:image/png;base64,OTHER')).toBeNull();
  });
});

describe('Lot 3B — Accueil : visuel local existant et pluriels 0 / 1 / 2', () => {
  it('résout toujours un fichier existant dans public/ même avec un preset couleur non-image', () => {
    const home = read('app/(tabs)/index.tsx');
    expect(home).not.toContain('lumina-landscape.png');

    for (const url of [
      resolveDailyCardVisual('lara-red', 'light'),
      resolveDailyCardVisual('lumina', 'dark'),
      resolveDailyCardVisual('nat-trees', 'light'),
      resolveDailyCardVisual('obj-miroir', 'light'),
    ]) {
      expect(existsSync(join(ROOT, 'public', url))).toBe(true);
    }
  });

  it('formate correctement les pluriels 0, 1 et 2 en français et en anglais', () => {
    expect(formatStreakDaysLabel(0, 'fr')).toBe('0 jour consécutif');
    expect(formatStreakDaysLabel(1, 'fr')).toBe('1 jour consécutif');
    expect(formatStreakDaysLabel(2, 'fr')).toBe('2 jours consécutifs');

    expect(formatStreakDaysLabel(0, 'en')).toBe('0 consecutive days');
    expect(formatStreakDaysLabel(1, 'en')).toBe('1 consecutive day');
    expect(formatStreakDaysLabel(2, 'en')).toBe('2 consecutive days');

    expect(formatLastSevenDaysAria(0, 'fr')).toBe('0 jour sur les 7 derniers');
    expect(formatLastSevenDaysAria(1, 'fr')).toBe('1 jour sur les 7 derniers');
    expect(formatLastSevenDaysAria(3, 'fr')).toBe('3 jours sur les 7 derniers');
  });
});

describe('Lot 3C & 3D — Historique FSRS rétrocompatible et noms bibliques complets', () => {
  it('associe chaque log de révision à memorizationRecordId et gère les fiches historiques sans inventer de séances', () => {
    const calendar = read('app/review/calendar.tsx');
    const history = read('app/review/History.tsx');
    expect(calendar).toContain('recordId: log.memorizationRecordId');
    expect(calendar).toContain("kind: 'legacy-review'");
    expect(history).toContain('listByUser');
    expect(history).toContain('legacyTotalReviews');
  });

  it('affiche les noms complets des livres bibliques via formatVerseKey (IDs internes, codes USFM, FR/EN et Array.map)', () => {
    expect(formatVerseKey('joh:3:16', 'fr')).toBe('Jean 3:16');
    expect(formatVerseKey('joh:3:16', 'en')).toBe('John 3:16');
    expect(formatVerseKey('psa:23:1', 'fr')).toBe('Psaumes 23:1');
    expect(formatVerseKey('1cor:13:4', 'fr')).toBe('1 Corinthiens 13:4');
    expect(formatVerseKey('1co:13:4', 'fr')).toBe('1 Corinthiens 13:4');
    expect(formatVerseKey('1co:13:4', 'en')).toBe('1 Corinthians 13:4');
    expect(['rom:8:28', 'gen:1:1'].map(formatVerseKey)).toEqual([
      formatVerseKey('rom:8:28'),
      formatVerseKey('gen:1:1'),
    ]);
  });

  it('rend la sélection de verset et la barre d’actions accessibles au clavier et sans référence brute', () => {
    const manuscript = read('src/components/bible/ManuscriptView.tsx');
    const actionBar = read('src/components/bible/VerseActionBar.tsx');
    expect(manuscript).toContain('role="button"');
    expect(manuscript).toContain('tabIndex={0}');
    expect(manuscript).toContain('aria-pressed={isSelected}');
    expect(actionBar).toContain('bibleVerseReference: reference');
    expect(actionBar).not.toContain('bibleVerseReference: `${bookId} ${chapter}:${verse}`');
  });
});
