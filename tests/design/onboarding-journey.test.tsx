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

afterEach(async () => {
  cleanup();
  useAppearanceStore.getState().resetToDefaults();
  useSettingsStore.setState({ onboardingCompleted: false, bibleTranslation: 'lsg', uiLanguage: 'fr' });
  // Le choix de langue de l'étape 2 s'applique pour de vrai (i18next est
  // global) : sans ce retour au français, les tests suivants lisent l'espagnol.
  await i18next.changeLanguage('fr');
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

describe('parcours complet, d’un bout à l’autre', () => {
  it('traverse les sept étapes sans se bloquer et termine sur /tabs/home', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding/welcome']}>
        <Routes>
          {(
            [
              ['/onboarding/welcome', <WelcomeScreen />],
              ['/onboarding/language-select', <LanguageScreen />],
              ['/onboarding/personalization', <PersonalizationScreen />],
              ['/onboarding/translation-select', <TranslationScreen />],
              ['/onboarding/session-config', <RhythmScreen />],
              ['/onboarding/reminder-config', <RemindersScreen />],
              ['/onboarding/fsrs-introduction', <ReadyScreen />],
            ] as [string, React.ReactElement][]
          ).map(([path, element]) => (
            <Route
              key={path}
              path={path}
              element={
                <>
                  <LocationProbe />
                  {element}
                </>
              }
            />
          ))}
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const clickPrimary = () => {
      const primary = document.querySelector('footer button.bg-primary');
      expect(primary).not.toBeNull();
      fireEvent.click(primary as HTMLElement);
    };

    // 1. Bienvenue
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/language-select');

    // 2. Langue — le clic qui bloquait l'utilisateur
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/personalization');

    // 3. Apparence
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/translation-select');

    // 4. Traduction
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/session-config');

    // 5. Rythme
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/reminder-config');

    // 6. Rappels
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/fsrs-introduction');

    // 7. Prêt → accueil
    clickPrimary();
    expect(screen.getByTestId('location')).toHaveTextContent('/tabs/home');
    expect(useSettingsStore.getState().onboardingCompleted).toBe(true);
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

describe('enchaînement : chaque action principale fait avancer', () => {
  // Régression : « Choisir ma langue » enregistrait la langue puis restait sur
  // l'écran — l'utilisateur se retrouvait bloqué à l'étape 2. La coquille
  // navigue désormais elle-même après l'action de l'étape.
  const stepActions: {
    path: string;
    element: () => React.ReactElement;
    label: RegExp;
    expected: string;
  }[] = [
    { path: '/onboarding/welcome', element: () => <WelcomeScreen />, label: /choisir ma langue/i, expected: '/onboarding/language-select' },
    { path: '/onboarding/language-select', element: () => <LanguageScreen />, label: /choisir ma langue/i, expected: '/onboarding/personalization' },
    { path: '/onboarding/personalization', element: () => <PersonalizationScreen />, label: /garder cette apparence/i, expected: '/onboarding/translation-select' },
    { path: '/onboarding/translation-select', element: () => <TranslationScreen />, label: /choisir cette version/i, expected: '/onboarding/session-config' },
    { path: '/onboarding/session-config', element: () => <RhythmScreen />, label: /garder ce rythme/i, expected: '/onboarding/reminder-config' },
    { path: '/onboarding/reminder-config', element: () => <RemindersScreen />, label: /enregistrer mon rappel/i, expected: '/onboarding/fsrs-introduction' },
  ];

  for (const step of stepActions) {
    it(`${step.path} : l'action principale mène à ${step.expected}`, () => {
      renderAt(step.element(), step.path);
      fireEvent.click(screen.getByRole('button', { name: step.label }));
      expect(screen.getByTestId('location')).toHaveTextContent(step.expected);
    });
  }

  it('l’étape Langue enregistre le choix avant d’avancer', () => {
    renderAt(<LanguageScreen />, '/onboarding/language-select');
    fireEvent.click(screen.getByRole('button', { name: /español/i }));
    expect(useSettingsStore.getState().uiLanguage).toBe('es');

    // L'interface vient de basculer en espagnol : on vise l'action principale
    // par sa place (le bouton d'accent du pied), pas par son libellé traduit.
    const primary = document.querySelector('footer button.bg-primary');
    expect(primary).not.toBeNull();
    fireEvent.click(primary!);

    expect(useSettingsStore.getState().uiLanguage).toBe('es');
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/personalization');
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
