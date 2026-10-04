/**
 * ProfileAvatar — premium avatar for the profile screen.
 *
 * Priority chain:
 *   1. A user-uploaded photo URL (`photo`), if provided.
 *   2. A themed vector illustration from the existing offline theme catalog
 *      (`public/themes/...`), deterministically derived from a seed. This is
 *      the "fallback illustration" — it needs no network and stays on-brand.
 *   3. The user's initial on a gradient tile (last resort).
 */

import { useMemo } from 'react';
import { ALL_THEMES, themeLandscapeUrl } from '@/theme/theme-catalog';

/** Pick a deterministic theme illustration from a string seed (name/id/etc). */
function pickTheme(seed: string) {
  const themes = ALL_THEMES;
  if (!themes.length) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const theme = themes[Math.abs(hash) % themes.length];
  return {
    src: themeLandscapeUrl(theme.id),
    label: `${theme.name} · ${theme.motif}`,
  };
}

interface ProfileAvatarProps {
  /** Optional user-provided photo (a data URL or a remote URL). */
  photo?: string | null;
  /** Display name used to derive the fallback illustration + initial. */
  name?: string | null;
  /** Pixel size of the avatar circle. */
  size?: number;
  className?: string;
}

export function ProfileAvatar({ photo, name, size = 64, className }: ProfileAvatarProps) {
  const seed = name?.trim() || 'u';
  const fallback = useMemo(() => pickTheme(seed), [seed]);
  const initial = (name?.trim().charAt(0) || 'U').toUpperCase();

  return (
    <div
      className={
        'relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/25 ' +
        (className ?? '')
      }
      style={{ width: size, height: size }}
      aria-label={name ? `Avatar de ${name}` : 'Avatar'}
    >
      {/* 1. Photo, if the user set one. */}
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          {/* 2. Vector illustration fallback (theme catalog, offline). */}
          {fallback && (
            <img
              src={fallback.src}
              alt={fallback.label}
              title={fallback.label}
              className="h-full w-full object-cover"
            />
          )}

          {/* 3. Initial on a gradient tile, under the illustration. */}
          <div className="gradient-hero absolute inset-0 flex items-center justify-center">
            <span
              className="font-extrabold text-white/90"
              style={{ fontSize: Math.round(size * 0.4), opacity: 0.35 }}
            >
              {initial}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileAvatar;
