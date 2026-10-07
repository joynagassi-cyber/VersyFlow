import { useTranslation } from 'react-i18next';
import { Check, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useAppearanceStore } from '@/store/appearance-store';
import { ACCENT_PRESETS } from '@/theme/theme-presets';
import { THEME_CATEGORIES } from '@/theme/theme-catalog';
import { BIBLE_FONTS } from '@/theme/theme-fonts';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 28;
const LINE_HEIGHT_MIN = 1.2;
const LINE_HEIGHT_MAX = 2.2;
const LETTER_SPACING_MIN = -0.02;
const LETTER_SPACING_MAX = 0.12;
const LINE_LENGTH_MIN = 28;
const LINE_LENGTH_MAX = 80;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={on}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-border')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
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
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        <span className="text-xs font-bold tabular-nums text-primary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-tint accent-[var(--color-primary)]"
        aria-label={label}
      />
    </div>
  );
}

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const themeMode = useAppearanceStore((s) => s.themeMode);
  const accent = useAppearanceStore((s) => s.accent);
  const colorThemeId = useAppearanceStore((s) => s.colorThemeId);
  const fontSize = useAppearanceStore((s) => s.fontSize);
  const showVerseNumbers = useAppearanceStore((s) => s.showVerseNumbers);
  const focusMode = useAppearanceStore((s) => s.focusMode);
  const bibleFontFamily = useAppearanceStore((s) => s.bibleFontFamily);
  const bibleFontSize = useAppearanceStore((s) => s.bibleFontSize);
  const bibleLineHeight = useAppearanceStore((s) => s.bibleLineHeight);
  const bibleLetterSpacing = useAppearanceStore((s) => s.bibleLetterSpacing);
  const bibleLineLength = useAppearanceStore((s) => s.bibleLineLength);
  const setThemeMode = useAppearanceStore((s) => s.setThemeMode);
  const setColorTheme = useAppearanceStore((s) => s.setColorTheme);
  const setFontSize = useAppearanceStore((s) => s.setFontSize);
  const toggleVerseNumbers = useAppearanceStore((s) => s.toggleVerseNumbers);
  const setFocusMode = useAppearanceStore((s) => s.setFocusMode);
  const setBibleFontFamily = useAppearanceStore((s) => s.setBibleFontFamily);
  const setBibleFontSize = useAppearanceStore((s) => s.setBibleFontSize);
  const setBibleLineHeight = useAppearanceStore((s) => s.setBibleLineHeight);
  const setBibleLetterSpacing = useAppearanceStore((s) => s.setBibleLetterSpacing);
  const setBibleLineLength = useAppearanceStore((s) => s.setBibleLineLength);

  const themeOptions: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: t('settings.themeLight', 'Clair'), Icon: Sun },
    { value: 'dark', label: t('settings.themeDark', 'Sombre'), Icon: Moon },
    { value: 'system', label: t('settings.themeSystem', 'Système'), Icon: Monitor },
  ];

  const totalThemes = THEME_CATEGORIES.reduce((n, c) => n + c.themes.length, 0);

  return (
    <FullScreenPage title={t('settings.theme', 'Thème')}>
      <div className="mx-auto max-w-md">
        <Section title={t('settings.themeMode', 'Mode')}>
          <div className="flex flex-col gap-2">
            {themeOptions.map(({ value, label, Icon }) => {
              const active = themeMode === value;
              return (
                <button
                  key={value}
                  onClick={() => setThemeMode(value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-3 text-left transition',
                    active ? 'bg-surface-tint' : 'active:bg-surface-tint/50',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full',
                      active ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className={cn('flex-1 text-sm font-medium', active ? 'text-primary' : 'text-text-primary')}>
                    {label}
                  </span>
                  {active && <Check size={18} className="text-primary" />}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t('settings.accentColor', "Couleur d'accent")}>
          <div className="grid grid-cols-4 gap-3">
            {ACCENT_PRESETS.map((p) => {
              const active = accent === p.key && colorThemeId == null;
              return (
                <button
                  key={p.key}
                  onClick={() => setColorTheme(null)}
                  aria-pressed={active}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white transition',
                      active ? 'border-text-primary' : 'border-transparent',
                    )}
                    style={{ backgroundColor: p.swatch }}
                  >
                    {active && <Check size={18} className="text-white" />}
                  </span>
                  <span className="text-[11px] font-medium text-text-muted">{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Image-based color themes (100 flat-2D monochrome illustrations) */}
          <button
            type="button"
            onClick={() => navigate('/settings/theme-picker')}
            className={cn(
              'mt-3 flex w-full items-center gap-3 rounded-xl p-3 text-left transition',
              colorThemeId != null
                ? 'bg-primary/10 ring-1 ring-primary/30'
                : 'bg-surface-tint/50 active:bg-surface-tint',
            )}
          >
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                colorThemeId != null ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
              )}
            >
              <Palette size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-text-primary">
                {t('settings.themeImage', "Thèmes d'image")}
              </span>
              <span className="block text-xs text-text-muted">
                {totalThemes} {t('settings.themeImagesCount', 'illustrations 2D monochromes par catégorie')}
              </span>
            </span>
            <span className="text-xs font-bold text-primary">›</span>
          </button>
        </Section>

        {/* ── Lecture : full Bible reading controls (font + fine spacing) ── */}
        <Section title={t('settings.reading', 'Lecture')}>
          {/* Font family selector — 10 premium serifs, live preview in own family */}
          <div className="grid grid-cols-2 gap-2">
            {BIBLE_FONTS.map((font) => {
              const active = bibleFontFamily === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => setBibleFontFamily(font.id)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-xl border-2 p-2.5 text-left transition',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface-tint/40 active:bg-surface-tint',
                  )}
                >
                  <span
                    className="text-base leading-tight text-text-primary"
                    style={{ fontFamily: font.family }}
                  >
                    {t('settings.fonts.' + font.id, font.label)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wide',
                      active ? 'text-primary' : 'text-text-muted',
                    )}
                  >
                    Aa · {font.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fine spacing controls */}
          <div className="mt-4 border-t border-[color:var(--color-divider)] pt-3">
            <SliderRow
              label={t('settings.reading.size', 'Taille')}
              value={bibleFontSize}
              display={`${bibleFontSize}px`}
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              step={1}
              onChange={setBibleFontSize}
            />
            <SliderRow
              label={t('settings.reading.lineHeight', 'Interlignage')}
              value={bibleLineHeight}
              display={bibleLineHeight.toFixed(2)}
              min={LINE_HEIGHT_MIN}
              max={LINE_HEIGHT_MAX}
              step={0.05}
              onChange={setBibleLineHeight}
            />
            <SliderRow
              label={t('settings.reading.letterSpacing', 'Espacement des lettres')}
              value={bibleLetterSpacing}
              display={`${(bibleLetterSpacing * 100).toFixed(1)}‱`}
              min={LETTER_SPACING_MIN}
              max={LETTER_SPACING_MAX}
              step={0.005}
              onChange={setBibleLetterSpacing}
            />
            <SliderRow
              label={t('settings.reading.lineLength', 'Largeur de colonne')}
              value={bibleLineLength}
              display={`${bibleLineLength} em`}
              min={LINE_LENGTH_MIN}
              max={LINE_LENGTH_MAX}
              step={1}
              onChange={setBibleLineLength}
            />
          </div>
        </Section>

        <Section title={t('settings.fontSize', 'Taille du texte')}>
          <div className="flex justify-between gap-2">
            {[14, 16, 18, 20, 22].map((size) => {
              const active = fontSize === size;
              return (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={cn(
                    'flex-1 rounded-xl py-2.5 text-sm font-semibold transition',
                    active ? 'gradient-hero text-white' : 'bg-surface-tint text-text-primary',
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={t('settings.display', 'Affichage')}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {t('settings.verseNumbers', 'Numéros de versets')}
              </span>
              <Toggle on={showVerseNumbers} onChange={toggleVerseNumbers} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">
                {t('settings.focusMode', 'Mode concentration')}
              </span>
              <Toggle on={focusMode} onChange={() => setFocusMode(!focusMode)} />
            </div>
          </div>
        </Section>
      </div>
    </FullScreenPage>
  );
}
