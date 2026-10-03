import { useTranslation } from 'react-i18next';
import { Check, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useAppearanceStore } from '@/store/appearance-store';
import { ACCENT_PRESETS } from '@/theme/theme-presets';
import { THEME_CATEGORIES } from '@/theme/theme-catalog';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark' | 'system';

const FONT_SIZES = [14, 16, 18, 20, 22];

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

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    themeMode,
    accent,
    colorThemeId,
    fontSize,
    showVerseNumbers,
    focusMode,
    setThemeMode,
    setColorTheme,
    setFontSize,
    toggleVerseNumbers,
    setFocusMode,
  } = useAppearanceStore();

  const themeOptions: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: t('settings.themeLight', 'Clair'), Icon: Sun },
    { value: 'dark', label: t('settings.themeDark', 'Sombre'), Icon: Moon },
    { value: 'system', label: t('settings.themeSystem', 'Systeme'), Icon: Monitor },
  ];

  const totalThemes = THEME_CATEGORIES.reduce((n, c) => n + c.themes.length, 0);

  return (
    <FullScreenPage title={t('settings.theme', 'Theme')}>
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

        <Section title={t('settings.accentColor', 'Couleur d\'accent')}>
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

        <Section title={t('settings.fontSize', 'Taille du texte')}>
          <div className="flex justify-between gap-2">
            {FONT_SIZES.map((size) => {
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
                {t('settings.verseNumbers', 'Numeros de versets')}
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
