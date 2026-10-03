/**
 * ThemePicker — select an image-based color theme from the 100-theme catalog.
 *
 * Grid of landscape thumbnails grouped by category (10 categories × 10
 * themes). Each thumbnail shows the motif + name + a color swatch. Selecting
 * one applies the portrait as the app background (via ThemeManager) and sets
 * the accent color to the theme's core hex. The current selection is
 * persisted in the appearance store.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { useAppearanceStore } from '@/store/appearance-store';
import {
  THEME_CATEGORIES,
  themeLandscapeUrl,
  type ThemeCatalogEntry,
} from '@/theme/theme-catalog';
import { cn } from '@/lib/utils';

export default function ThemePickerScreen() {
  const { t } = useTranslation();
  const colorThemeId = useAppearanceStore((s) => s.colorThemeId);
  const setColorTheme = useAppearanceStore((s) => s.setColorTheme);
  const [expanded, setExpanded] = useState<string | null>(THEME_CATEGORIES[0].id);

  const select = (entry: ThemeCatalogEntry) => {
    setColorTheme(entry.id);
  };

  return (
    <FullScreenPage title={t('settings.themeImage', "Thème d'image")}>
      <div className="mx-auto max-w-md">
        {/* Pure white / black quick reset */}
        <div className="mb-4 rounded-2xl bg-surface p-3 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            {t('settings.themeReset', 'Fond par défaut')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setColorTheme(null)}
              className={cn(
                'flex-1 rounded-xl border p-3 text-left transition',
                colorThemeId == null
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface-tint/40',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
                <span className="text-sm font-medium text-text-primary">
                  {t('settings.themeWhite', 'Blanc pur #FFFFFF')}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setColorTheme(null)}
              className="flex-1 rounded-xl border border-border bg-surface-tint/40 p-3 text-left"
            >
              <span className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-[#121212]" />
                <span className="text-sm font-medium text-text-primary">
                  {t('settings.themeBlack', 'Noir pur #121212')}
                </span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {t(
              'settings.themeResetHint',
              'Les deux fonds restent identiques ; seuls les thèmes d’image les changent.',
            )}
          </p>
        </div>

        {/* Category accordion */}
        {THEME_CATEGORIES.map((cat) => {
          const open = expanded === cat.id;
          return (
            <section key={cat.id} className="mb-3 rounded-2xl bg-surface shadow-sm">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : cat.id)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-bold text-text-primary">{cat.name}</span>
                <span className="text-xs text-text-muted">
                  {cat.themes.length} · {open ? '▲' : '▼'}
                </span>
              </button>
              {open && (
                <div className="grid grid-cols-2 gap-2 p-3">
                  {cat.themes.map((entry) => {
                    const active = colorThemeId === entry.id;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => select(entry)}
                        className={cn(
                          'relative overflow-hidden rounded-xl border-2 p-2 text-left transition',
                          active ? 'border-primary' : 'border-border',
                        )}
                      >
                        <img
                          src={themeLandscapeUrl(entry.id)}
                          alt={entry.name}
                          loading="lazy"
                          className="aspect-[3/2] w-full rounded-lg bg-white object-cover"
                        />
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ background: entry.color }}
                          />
                          <span className="truncate text-xs font-medium text-text-primary">
                            {entry.name}
                          </span>
                          {active && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                              <Check size={11} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </FullScreenPage>
  );
}
