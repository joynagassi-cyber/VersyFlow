import { goBackSafely } from '@/lib/navigation';
import { Switch } from '@/components/ui/Switch';
import { BackgroundControls } from '@/components/ui/BackgroundControls';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Sun01Icon, Moon01Icon, ComputerIcon, Tick01Icon } from '@/components/ui/solar-icons';

function Check({ size = 18, className }: { size?: number; className?: string }) {
  return <DuoIcon icon={Tick01Icon} size={size} className={className} color="currentColor" />;
}
import { IonPage } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft01Icon } from '@/components/ui/solar-icons';
import { useEffect, useState, type CSSProperties } from 'react';
import HomeScreen from '../(tabs)/index';
import { useAppearanceStore } from '@/store/appearance-store';
import { GRADIENTS } from '@/theme/gradients';
import { DEFAULT_PRESET, PRESET_CATALOG } from '@/theme/preset-catalog';
import { FIXED_ACCENTS } from '@/theme/fixed-accents';
import { APPEARANCE_UI_FONTS, APPEARANCE_READING_FONTS, findBibleFont, findUiFont, loadBibleFont } from '@/theme/theme-fonts';
import { themeLandscapeUrl, themePortraitUrl } from '@/theme/theme-catalog';
import { THEME_CATEGORIES } from '@/theme/theme-catalog';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';
type AppearanceTab = 'background' | 'colors' | 'text' | 'glass';
const BACKGROUND_GRADIENTS = GRADIENTS.filter((gradient) => !['sunny-morning', 'malibu-beach', 'true-sunset'].includes(gradient.id));

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 22;
const LINE_HEIGHT_MIN = 1.2;
const LINE_HEIGHT_MAX = 2.2;
const LETTER_SPACING_MIN = -0.02;
const LETTER_SPACING_MAX = 0.12;
const LINE_LENGTH_MIN = 28;
const LINE_LENGTH_MAX = 80;

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="g2 appearance-section mb-5 p-4">
      <div className="appearance-section-heading"><h2 className="section-label mb-3">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

/** Un interrupteur, une implémentation : `ui/Switch` (rôle, cible 40 px,
 *  pouce `--on-primary`). L'écran ne redessine pas la sienne. */
function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <Switch checked={on} onCheckedChange={onChange} label={label} />;
}

/** Labeled range control for a single reading parameter. */
function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="appearance-slider-label">{label}</span>
        <span className="appearance-slider-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-range"
        style={{ '--range-progress': `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%` } as CSSProperties}
        aria-label={label}
      />
    </div>
  );
}

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AppearanceTab>('background');
  const [category, setCategory] = useState('all');
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const colorThemeId = useAppearanceStore((s) => s.colorThemeId);
  const presetId = useAppearanceStore((s) => s.presetId);
  const fixedAccentId = useAppearanceStore((s) => s.fixedAccentId);
  const setFixedAccentId = useAppearanceStore((s) => s.setFixedAccentId);
  const setPreset = useAppearanceStore((s) => s.setPreset);
  const backgroundType = useAppearanceStore((s) => s.backgroundType);
  const gradientId = useAppearanceStore((s) => s.gradientId);
  const setGradient = useAppearanceStore((s) => s.setGradient);
  const setBackgroundType = useAppearanceStore((s) => s.setBackgroundType);
  const uiFontId = useAppearanceStore((s) => s.uiFontId);
  const setUiFontId = useAppearanceStore((s) => s.setUiFontId);
  const showVerseNumbers = useAppearanceStore((s) => s.showVerseNumbers);
  const focusMode = useAppearanceStore((s) => s.focusMode);
  const reducedTransparency = useAppearanceStore((s) => s.reducedTransparency);
  const highContrast = useAppearanceStore((s) => s.highContrast);
  const setReducedTransparency = useAppearanceStore((s) => s.setReducedTransparency);
  const setHighContrast = useAppearanceStore((s) => s.setHighContrast);
  const bibleFontFamily = useAppearanceStore((s) => s.bibleFontFamily);
  const bibleFontSize = useAppearanceStore((s) => s.bibleFontSize);
  const bibleLineHeight = useAppearanceStore((s) => s.bibleLineHeight);
  const bibleLetterSpacing = useAppearanceStore((s) => s.bibleLetterSpacing);
  const bibleLineLength = useAppearanceStore((s) => s.bibleLineLength);
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode);
  const setColorTheme = useAppearanceStore((s) => s.setColorTheme);
  const toggleVerseNumbers = useAppearanceStore((s) => s.toggleVerseNumbers);
  const setFocusMode = useAppearanceStore((s) => s.setFocusMode);
  const setBibleFontFamily = useAppearanceStore((s) => s.setBibleFontFamily);
  const setBibleFontSize = useAppearanceStore((s) => s.setBibleFontSize);
  const setBibleLineHeight = useAppearanceStore((s) => s.setBibleLineHeight);
  const setBibleLetterSpacing = useAppearanceStore((s) => s.setBibleLetterSpacing);
  const setBibleLineLength = useAppearanceStore((s) => s.setBibleLineLength);
  const resetTextSettings = useAppearanceStore((s) => s.resetTextSettings);
  const [fontLoadFailed, setFontLoadFailed] = useState(false);
  useEffect(() => {
    if (tab !== 'text') return;
    let active = true;
    void Promise.allSettled([...APPEARANCE_READING_FONTS, ...APPEARANCE_UI_FONTS].map((font) => loadBibleFont(font.id))).then((results) => {
      if (active) setFontLoadFailed(results.some((result) => result.status === 'rejected'));
    });
    return () => { active = false; };
  }, [tab]);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(() =>
    themeMode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeMode,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setPreviewMode(themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [themeMode]);
  const previewBackground = backgroundType === 'image' && colorThemeId
    ? `url("${themePortraitUrl(colorThemeId)}")`
    : backgroundType === 'gradient' ? GRADIENTS.find((g) => g.id === gradientId)?.css ?? 'none' : 'none';
  const tabs: { id: AppearanceTab; label: string }[] = [
    { id: 'background', label: t('appearanceEditor.background', 'Fond') },
    { id: 'colors', label: t('appearanceEditor.colors', 'Couleurs') },
    { id: 'text', label: t('appearanceEditor.text', 'Texte') },
    { id: 'glass', label: t('appearanceEditor.glass', 'Verre') },
  ];

  const themeOptions: { value: ThemeMode; label: string; Icon: typeof Sun01Icon }[] = [
    { value: 'light', label: t('settings.themeLight', 'Clair'), Icon: Sun01Icon },
    { value: 'dark', label: t('settings.themeDark', 'Sombre'), Icon: Moon01Icon },
    { value: 'system', label: t('settings.themeSystem', 'Système'), Icon: ComputerIcon },
  ];

  return (
    <IonPage className="appearance-shell">
      <header className="appearance-header">
        <button type="button" onClick={() => goBackSafely(navigate)} aria-label={t('common.back', 'Retour')}><DuoIcon icon={ArrowLeft01Icon} size={22} /></button>
        <h1>{t('nav.theme', 'Thème et apparence')}</h1>
      </header>
      <div className="app-canvas appearance-page h-full overflow-y-auto p-4"><div className="appearance-editor">
        <aside className="appearance-preview" data-theme={previewMode}>
          <div className="appearance-preview-heading"><strong>{t('appearanceEditor.preview', 'Aperçu')}</strong>
            <div className="appearance-preview-actions" role="group" aria-label={t('appearanceEditor.previewMode', 'Mode de l’aperçu')}>
              <button type="button" aria-pressed={previewMode === 'light'} onClick={() => setPreviewMode('light')}>{t('settings.light', 'Clair')}</button>
              <button type="button" aria-pressed={previewMode === 'dark'} onClick={() => setPreviewMode('dark')}>{t('settings.dark', 'Sombre')}</button>
              <button type="button" className="appearance-apply" onClick={() => setThemeMode(previewMode)}>{t('appearanceEditor.apply', 'Appliquer')}</button>
            </div>
          </div>
          <div className="appearance-preview-window" data-preview-background={backgroundType}>
            <div className="appearance-preview-image" aria-hidden="true" style={{ backgroundImage: previewBackground }} />
            <div className="appearance-mini-stage" aria-hidden="true" ref={(node) => node?.setAttribute('inert', '')}><HomeScreen /></div>
          </div>
        </aside>
        <div className="appearance-controls">
          <nav className="appearance-tabs" aria-label={t('settings.theme', 'Thème')}>
            {tabs.map((item) => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
          </nav>
        {tab === 'colors' && <>
        <Section title={t('appearanceEditor.accent', 'Accent')} action={<button type="button" className="appearance-reset" onClick={() => setFixedAccentId(null)}>{t('appearanceEditor.reset', 'Réinitialiser')}</button>}>
          <p className="appearance-hint">{t('appearanceEditor.accentHint', 'Un seul accent pour les boutons, éléments actifs, progrès, interrupteurs et voile.')}</p>
          <div className="appearance-accent-choices" role="group" aria-label={t('appearanceEditor.accent', 'Accent')}>
            <button type="button" className="appearance-accent-auto" aria-pressed={fixedAccentId === null} onClick={() => setFixedAccentId(null)}>
              {t('appearanceEditor.fromImage', 'Depuis l’image')}{fixedAccentId === null && <Check size={18} />}
            </button>
            <div className="appearance-accent-swatches">
              {FIXED_ACCENTS.map((option) => <button type="button" key={option.id} aria-label={option.label} title={option.label} aria-pressed={fixedAccentId === option.id} onClick={() => setFixedAccentId(option.id)}>
                <span className="appearance-accent-swatch" style={{ backgroundColor: option.color }} />
                {fixedAccentId === option.id && <Check size={16} />}
              </button>)}
            </div>
          </div>
          {fixedAccentId === null && backgroundType !== 'image' && <p className="appearance-hint appearance-accent-note">{t('appearanceEditor.imageAccentHint', 'Choisissez une image pour en extraire l’accent ; sinon l’accent du thème reste actif.')}</p>}
        </Section>
        <Section title={t('appearanceEditor.accentPreview', 'Aperçu de l’accent')}>
          <div className="appearance-accent-examples" aria-label={t('appearanceEditor.accentPreview', 'Aperçu de l’accent')}>
            <span className="appearance-example-button">{t('appearanceEditor.button', 'Bouton')}</span>
            <span className="appearance-example-active">{t('appearanceEditor.activeTab', 'Onglet actif')}</span>
            <span className="appearance-example-ring" role="img" aria-label={t('appearanceEditor.progressRing', 'Anneau de progression')} />
          </div>
        </Section>
        <details className="appearance-existing"><summary>{t('appearanceEditor.existingThemes', 'Modes et thèmes existants')}</summary>
        <Section title={t('settings.themeMode', 'Mode')}>
          <div className="flex flex-col gap-2">
            {themeOptions.map(({ value, label, Icon }) => {
              const active = themeMode === value;
              return (
                <button
                  key={value}
                  onClick={() => setThemeMode(value)}
                  aria-pressed={active}
                  className={cn(
                    'appearance-mode flex items-center gap-3 rounded-xl p-3 text-left transition',
                    active && 'is-active',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      'appearance-mode-icon',
                    )}
                  >
                    <DuoIcon icon={Icon} size={19} />
                  </span>
                  <span className="flex-1 text-sm font-medium">
                    {label}
                  </span>
                  {active && <Check size={18} />}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Plateforme de personnalisation ─────────────────────────────
            Tout le style de l'app vient d'ici : preset tweakcn (couleurs),
            fond dégradé (webgradients) ou image (accent extrait de l'image).
            Aucun style n'est codé en dur dans les écrans. */}
        <Section title={t('settings.themePreset', 'Thème')}>
          {/* Aperçus professionnels : chaque carte est une miniature
              d'écran (en-tête, carte de verset, bouton, onglets) dessinée
              avec les VRAIS tokens du thème — l'utilisateur voit exactement
              à quoi l'app ressemblera avant de choisir. */}
          <div className="grid grid-cols-2 gap-3">
            {PRESET_CATALOG.map((preset) => {
              const active = (presetId ?? DEFAULT_PRESET) === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset.id)}
                  aria-pressed={active}
                  className="appearance-preset-choice"
                >
                  <span>{preset.label}</span>
                  {preset.hybrid && <small>{t('settings.hybrid', 'Fusion')}</small>}
                  {preset.darkOnly && <small>{t('settings.darkOnly', 'Sombre')}</small>}
                  {active && <Check size={16} /> }
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-2xs leading-relaxed text-text-muted">
            {t('settings.themePresetHint', 'Thèmes officiels tweakcn — le mode Clair/Sombre ci-dessus choisit la variante de chaque thème.')}
          </p>
        </Section>
        </details>
        </>}
        {tab === 'background' && <Section title={t('settings.background', "Fond de l'app")} action={<button type="button" className="appearance-reset" onClick={() => { setBackgroundType('none'); setCategory('all'); }}>{t('appearanceEditor.reset', 'Réinitialiser')}</button>}>
          <div className="appearance-segment mb-4 flex gap-2">
            {(
              [
                { value: 'none', label: t('settings.bgNone', 'Aucun') },
                { value: 'gradient', label: t('settings.bgGradient', 'Dégradé') },
                { value: 'image', label: t('settings.bgImage', 'Image') },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => opt.value === 'gradient' ? setGradient(GRADIENTS.some((g) => g.id === gradientId) ? gradientId : GRADIENTS[0].id) : setBackgroundType(opt.value)}
                aria-pressed={backgroundType === opt.value}
                className="appearance-segment-button"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {backgroundType === 'gradient' && <>
            {gradientId && !BACKGROUND_GRADIENTS.some((g) => g.id === gradientId) && <p className="appearance-hint">{t('appearanceEditor.currentGradient', 'Dégradé actuel')} : {gradientId.replace(/-/g, ' ')}</p>}
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_GRADIENTS.map((g) => {
                const active = gradientId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setGradient(g.id)}
                    style={{ backgroundImage: g.css }}
                    aria-pressed={active}
                    className={cn(
                      'appearance-gradient h-16 rounded-2xl p-2 text-left transition',
                      g.className,
                      active && 'is-active',
                    )}
                  >
                    <span className="appearance-gradient-label rounded-full px-2 py-0.5 text-3xs font-bold capitalize">
                      {g.id.replace(/^colorbase-/, '').replace(/-/g, ' ')}
                    </span>
                  </button>
                );
              })}
            </div></>}

          {backgroundType === 'image' && (
            <div className="appearance-image-picker">
              <p className="appearance-hint">{t('appearanceEditor.calmImages', 'Les images calmes donnent de meilleurs résultats')}</p>
              <div className="appearance-categories" role="group" aria-label={t('appearanceEditor.categories', 'Catégories')}>
                <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>{t('appearanceEditor.all', 'Tous')}</button>
                {THEME_CATEGORIES.map((cat) => <button type="button" key={cat.id} aria-pressed={category === cat.id} onClick={() => setCategory(cat.id)}>{cat.name}</button>)}
              </div>
              <div className="appearance-image-grid">
                {THEME_CATEGORIES.filter((cat) => category === 'all' || category === cat.id).flatMap((cat) => cat.themes.map((entry) => {
                  const active = colorThemeId === entry.id;
                  const available = entry.id !== 'obj-miroir'; // Both original images are absent from the catalog assets.
                  return <button type="button" key={entry.id} onClick={() => setColorTheme(entry.id)} aria-pressed={active} disabled={!available} className="appearance-image-option">
                    <span className={cn('appearance-thumbnail', active && 'is-active')}>
                      {available ? <picture><source type="image/webp" srcSet={themeLandscapeUrl(entry.id).replace('-landscape.png', '-thumb.webp')} />
                        <img src={themeLandscapeUrl(entry.id)} alt="" loading="lazy" decoding="async" /></picture> : <span className="appearance-image-unavailable">{t('appearanceEditor.imageUnavailable', 'Image indisponible')}</span>}
                      {active && <Check size={20} className="appearance-thumbnail-check" />}
                    </span><span className="appearance-image-title">{entry.name}</span>
                  </button>;
                }))}
              </div>
            </div>
          )}

          {backgroundType === 'none' && (
            <p className="text-2xs leading-relaxed text-text-muted">
              {t('settings.bgNoneHint', 'Le fond suit simplement le thème choisi ci-dessus.')}
            </p>
          )}
        </Section>}

        {tab === 'glass' && (
          <Section title={t('appearanceEditor.glass', 'Verre')}>
            <p className="appearance-hint">{t('appearanceEditor.glassHint', 'Réglez le flou, la transparence et le voile. L’aperçu utilise les surfaces de l’accueil.')}</p>
            {(backgroundType !== 'image' || !colorThemeId) && <p className="appearance-glass-note" role="status">{t('appearanceEditor.glassNeedsImage', 'Ces réglages sont enregistrés et s’appliqueront lorsque vous choisirez une image de fond.')}</p>}
            <BackgroundControls showPreview={false} />
          </Section>
        )}

        {tab === 'text' && <>
        <Section title={t('settings.uiFont', "Police de l'interface")} action={<button type="button" className="appearance-reset" onClick={resetTextSettings}>{t('appearanceEditor.resetText', 'Réinitialiser le texte')}</button>}>
          <p className="appearance-hint">{t('appearanceEditor.uiFontHint', 'Choisissez la police des éléments de l’interface.')}</p>
          {!APPEARANCE_UI_FONTS.some((font) => font.id === uiFontId) && <p className="appearance-font-legacy">{t('appearanceEditor.currentFont', 'Police actuelle : {{font}}', { font: findUiFont(uiFontId).label })}</p>}
          <div className="appearance-font-grid" role="group" aria-label={t('settings.uiFont', "Police de l'interface")}>
            {APPEARANCE_UI_FONTS.map((font) => <button type="button" key={font.id} onClick={() => setUiFontId(font.id)} aria-pressed={uiFontId === font.id} className="appearance-choice appearance-font-card" aria-label={font.id === 'system' ? t('appearanceEditor.themeFont', 'Police du thème') : font.label}>
              <span aria-hidden="true" className="appearance-font-sample" style={{ fontFamily: font.family || 'var(--theme-font-sans, var(--font-sans))' }}><strong>Ag</strong><span>{t('appearanceEditor.psalmText', "L’Éternel est mon berger : je ne manquerai de rien.")}</span></span>
              <span className="appearance-font-name">{font.id === 'system' ? t('appearanceEditor.themeFont', 'Police du thème') : font.label}</span>
              <span className="appearance-font-caption">{t('appearanceEditor.psalmRef', 'Psaume 23:1 · Louis Segond')}</span>
            </button>)}
          </div>
        </Section>
        <Section title={t('settings.reading', 'Lecture')}>
          <p className="appearance-hint">{t('appearanceEditor.readingFontHint', 'Choisissez la police des passages bibliques.')}</p>
          {fontLoadFailed && <p role="status" className="appearance-font-legacy">{t('appearanceEditor.fontLoadError', 'Certaines polices ne sont pas disponibles ; une police de secours est affichée.')}</p>}
          {!APPEARANCE_READING_FONTS.some((font) => font.id === bibleFontFamily) && <p className="appearance-font-legacy">{t('appearanceEditor.currentFont', 'Police actuelle : {{font}}', { font: findBibleFont(bibleFontFamily).label })}</p>}
          <div className="appearance-font-grid" role="group" aria-label={t('settings.reading', 'Lecture')}>
            {APPEARANCE_READING_FONTS.map((font) => <button type="button" key={font.id} onClick={() => setBibleFontFamily(font.id)} aria-pressed={bibleFontFamily === font.id} className="appearance-choice appearance-font-card" aria-label={font.label}>
              <span aria-hidden="true" className="appearance-font-sample" style={{ fontFamily: font.family }}><strong>Ag</strong><span>{t('appearanceEditor.psalmText', "L’Éternel est mon berger : je ne manquerai de rien.")}</span></span>
              <span className="appearance-font-name">{font.label}</span>
              <span className="appearance-font-caption">{t('appearanceEditor.psalmRef', 'Psaume 23:1 · Louis Segond')}</span>
            </button>)}
          </div>
          <div className="appearance-reading-controls">
            <SliderRow label={t('settings.reading.size', 'Taille')} value={bibleFontSize} display={`${bibleFontSize} px`} min={FONT_SIZE_MIN} max={FONT_SIZE_MAX} step={1} onChange={setBibleFontSize} />
            {bibleFontSize > FONT_SIZE_MAX && <p className="appearance-font-legacy">{t('appearanceEditor.legacySize', 'Votre taille enregistrée est conservée ; le curseur propose 14 à 22 px.')}</p>}
            <SliderRow label={t('settings.reading.lineHeight', 'Interlignage')} value={bibleLineHeight} display={bibleLineHeight.toFixed(2)} min={LINE_HEIGHT_MIN} max={LINE_HEIGHT_MAX} step={0.05} onChange={setBibleLineHeight} />
            <SliderRow label={t('settings.reading.letterSpacing', 'Espacement des lettres')} value={bibleLetterSpacing} display={`${bibleLetterSpacing.toFixed(3)} em`} min={LETTER_SPACING_MIN} max={LETTER_SPACING_MAX} step={0.005} onChange={setBibleLetterSpacing} />
            <SliderRow label={t('settings.reading.lineLength', 'Largeur de colonne')} value={bibleLineLength} display={`${bibleLineLength} em`} min={LINE_LENGTH_MIN} max={LINE_LENGTH_MAX} step={1} onChange={setBibleLineLength} />
          </div>
          <div className="appearance-reading-preview">
            <span className="appearance-font-caption">{t('appearanceEditor.liveReading', 'Aperçu de lecture')} · {t('appearanceEditor.psalmRef', 'Psaume 23:1 · Louis Segond')}</span>
            <p style={{ fontFamily: findBibleFont(bibleFontFamily).family, fontSize: `${bibleFontSize}px`, lineHeight: bibleLineHeight, letterSpacing: `${bibleLetterSpacing}em`, maxWidth: `${bibleLineLength}em` }}>{t('appearanceEditor.psalmText', "L’Éternel est mon berger : je ne manquerai de rien.")}</p>
          </div>
        </Section>
        </>}
        {tab === 'glass' && <Section title={t('settings.display', 'Affichage')}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {t('settings.verseNumbers', 'Numéros de versets')}
              </span>
              <Toggle label={t('settings.verseNumbers', 'Numéros de versets')} on={showVerseNumbers} onChange={toggleVerseNumbers} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {t('settings.focusMode', 'Mode concentration')}
              </span>
              <Toggle label={t('settings.focusMode', 'Mode concentration')} on={focusMode} onChange={() => setFocusMode(!focusMode)} />
            </div>

            <div className="flex items-center justify-between gap-3 py-2">
              <span className="flex-1 text-sm font-medium text-text-primary">
                {t('settings.reducedTransparency', 'Réduire la transparence')}
                <span className="mt-0.5 block text-xs font-normal text-text-muted">
                  {t('settings.reducedTransparencyHint', 'Surfaces opaques, sans effet de verre.')}
                </span>
              </span>
              <Toggle
                label={t('settings.reducedTransparency', 'Réduire la transparence')}
                on={reducedTransparency}
                onChange={() => setReducedTransparency(!reducedTransparency)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 py-2">
              <span className="flex-1 text-sm font-medium text-text-primary">
                {t('settings.highContrast', 'Contraste élevé')}
                <span className="mt-0.5 block text-xs font-normal text-text-muted">
                  {t('settings.highContrastHint', 'Contours renforcés, fond décoratif atténué.')}
                </span>
              </span>
              <Toggle label={t('settings.highContrast', 'Contraste élevé')} on={highContrast} onChange={() => setHighContrast(!highContrast)} />
            </div>
          </div>
        </Section>}
      </div></div></div>
    </IonPage>
  );
}
