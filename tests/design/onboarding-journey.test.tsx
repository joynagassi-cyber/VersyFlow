/**
 * Parcours d'entrée — la preuve que les sept étapes s'enchaînent, que le web
 * et le mobile lisent la même liste, et surtout que **la couleur choisie à
 * l'étape « Apparence » est encore là à la fin**.
 *
 * Défauts visés (signalés par l'utilisateur) :
 *  · « l'onboarding est trop basique » → sept étapes nommées, récap final ;
 *  · « la couleur du début ne s'applique pas à la fin » → le thème est écrit
 *    dans `appearance-store` (lu par ThemeManager) au moment du clic, et le
 *    récap final affiche CE thème, pas le défaut.
 */
import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18next from 'i18next';
import { initI18next } from '@/i18n/i18next-init';
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_STEPS,
  onboardingNextPath,
  onboardingPreviousPath,
} from '@/components/onboarding/steps';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAppearanceStore } from '@/store/appearance-store';
import { useSettingsStore } from '@/store/settings-store';
import { ThemeManager } from '@/components/ThemeManager';
import WelcomeScreen from '../../app/onboarding/welcome';
import LanguageScreen from '../../app/onboarding/language-select';
import PersonalizationScreen from '../../app/onboarding/personalization';
import TranslationScreen from '../../app/onboarding/translation-select';
import RhythmScreen from '../../app/onboarding/session-config';
import RemindersScreen from '../../app/onboarding/reminder-config';
import ReadyScreen from '../../app/onboarding/fsrs-introduction';

beforeAll(async () => {
  // jsdom n'implémente pas `matchMedia` : `ThemeManager` s'en sert pour suivre
  // le schéma système. Polyfill minimal, comme dans les autres tests de rendu.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  await initI18next();
  // Le détecteur de langue suit le navigateur (en-US en jsdom) : les
  // assertions portent sur la copie française, on fixe donc la langue.
  await i18next.changeLanguage('fr');
});

afterEach(() => {
  cleanup();
  useAppearanceStore.getState().resetToDefaults();
  useSettingsStore.setState({ onboardingCompleted: false, bibleTranslation: 'lsg', uiLanguage: 'fr' });
});

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderAt(element: React.ReactElement, path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<>{element}</>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('la liste des étapes', () => {
  it('compte sept étapes, toutes distinctes', () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(7);
    expect(new Set(ONBOARDING_STEPS.map((s) => s.path)).size).toBe(7);
    expect(new Set(ONBOARDING_STEPS.map((s) => s.id)).size).toBe(7);
  });

  it('enchaîne les chemins dans l’ordre et sait revenir', () => {
    expect(onboardingNextPath('welcome')).toBe('/onboarding/language-select');
    expect(onboardingNextPath('language')).toBe('/onboarding/personalization');
    expect(onboardingNextPath('appearance')).toBe('/onboarding/translation-select');
    expect(onboardingNextPath('ready')).toBeNull();
    expect(onboardingPreviousPath('welcome')).toBeNull();
    expect(onboardingPreviousPath('appearance')).toBe('/onboarding/language-select');
  });

  it('place l’apparence après la langue et avant la traduction', () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(ids.indexOf('appearance')).toBeGreaterThan(ids.indexOf('language'));
    expect(ids.indexOf('appearance')).toBeLessThan(ids.indexOf('translation'));
  });
});

describe('la coquille, deux mises en page', () => {
  it('affiche le sommaire nommé (web) et la progression segmentée (mobile)', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding/translation-select']}>
        <OnboardingShell
          stepId="translation"
          title="Titre d’essai"
          nextLabel="Continuer l’essai"
        >
          <p>contenu</p>
        </OnboardingShell>
      </MemoryRouter>,
    );

    // Web : un sommaire avec les noms des étapes, pas seulement des points.
    const nav = screen.getByRole('list', { name: /étapes du parcours/i });
    expect(nav.querySelectorAll('li')).toHaveLength(7);
    expect(nav.textContent).toContain('Traduction');

    // Mobile : une barre segmentée porteuse d'un état accessible.
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '4');
    expect(progress).toHaveAttribute('aria-valuemax', '7');
  });

  it('marque l’étape courante pour les lecteurs d’écran', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding/personalization']}>
        <OnboardingShell stepId="appearance" title="Titre" nextLabel="Suite">
          <p>contenu</p>
        </OnboardingShell>
      </MemoryRouter>,
    );
    const current = document.querySelector('[aria-current="step"]');
    expect(current?.textContent).toContain('Apparence');
  });
});

describe('étape Apparence', () => {
  it('applique le thème choisi immédiatement, dans le store lu par ThemeManager', () => {
    renderAt(<PersonalizationScreen />, '/onboarding/personalization');
    expect(useAppearanceStore.getState().presetId).not.toBe('emerald');

    fireEvent.click(screen.getByRole('button', { name: /emerald/i }));
    expect(useAppearanceStore.getState().presetId).toBe('emerald');

    fireEvent.click(screen.getByRole('button', { name: /^sombre$/i }));
    expect(useAppearanceStore.getState().themeMode).toBe('dark');
  });

  it('propose huit palettes, une seule active', () => {
    renderAt(<PersonalizationScreen />, '/onboarding/personalization');
    const swatches = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') !== null && button.className.includes('min-h-[64px]'));
    expect(swatches).toHaveLength(8);
    expect(swatches.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
  });

  it('affiche un aperçu qui suit vraiment le réglage de taille', () => {
    renderAt(<PersonalizationScreen />, '/onboarding/personalization');
    fireEvent.click(screen.getByRole('button', { name: /^grand$/i }));
    expect(useAppearanceStore.getState().bibleFontSize).toBe(22);
    const verse = screen.getByText(/Car Dieu a tant aimé le monde/);
    expect(verse).toHaveStyle({ fontSize: '22px' });
  });
});

describe('chaque étape se rend', () => {
  const steps: [string, React.ReactElement][] = [
    ['/onboarding/welcome', <WelcomeScreen />],
    ['/onboarding/language-select', <LanguageScreen />],
    ['/onboarding/personalization', <PersonalizationScreen />],
    ['/onboarding/translation-select', <TranslationScreen />],
    ['/onboarding/session-config', <RhythmScreen />],
    ['/onboarding/reminder-config', <RemindersScreen />],
    ['/onboarding/fsrs-introduction', <ReadyScreen />],
  ];

  it.each(steps)('%s rend un titre et une action, sans écran vide', (path, element) => {
    renderAt(element, path);
    expect(screen.getByRole('heading', { level: 1 }).textContent).not.toHaveLength(0);
    // Une seule action principale par étape (règle F06), toujours nommée.
    const primary = document.querySelectorAll('footer button:not([disabled])');
    expect(primary.length).toBeGreaterThan(0);
  });
});

describe('la couleur choisie s’applique pour de vrai', () => {
  it('écrit le preset sur <html> dès le clic, via ThemeManager', async () => {
    render(
      <MemoryRouter initialEntries={['/onboarding/personalization']}>
        <ThemeManager />
        <Routes>
          <Route path="/onboarding/personalization" element={<PersonalizationScreen />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /emerald/i }));

    // `ThemeManager` est le seul écrivain : il traduit le store en attribut
    // `data-preset`, que la feuille de thèmes lue par le CSS consomme.
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-preset')).toBe('emerald');
    });
    expect(useAppearanceStore.getState().presetId).toBe('emerald');
  });
});

describe('enchaînement et arrivée', () => {
  it('la bienvenue mène à la langue', () => {
    renderAt(<WelcomeScreen />, '/onboarding/welcome');
    fireEvent.click(screen.getByRole('button', { name: /choisir ma langue/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/language-select');
  });

  it('l’apparence mène à la traduction', () => {
    renderAt(<PersonalizationScreen />, '/onboarding/personalization');
    fireEvent.click(screen.getByRole('button', { name: /garder cette apparence/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/translation-select');
  });

  it('le récap final affiche le thème choisi, pas celui par défaut', () => {
    useAppearanceStore.getState().setPreset('sand-lifeos');
    useAppearanceStore.getState().setSessionGoal(5);
    renderAt(<ReadyScreen />, '/onboarding/fsrs-introduction');

    expect(screen.getByText(/Sand LifeOS/)).toBeTruthy();
    expect(screen.getByText(/5 versets par session/)).toBeTruthy();
  });

  it('« Démarrer avec ces réglages » termine le parcours', () => {
    renderAt(<ReadyScreen />, '/onboarding/fsrs-introduction');
    expect(useSettingsStore.getState().onboardingCompleted).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /démarrer avec ces réglages/i }));

    expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
    expect(screen.getByTestId('location')).toHaveTextContent('/tabs/home');
  });
});
