/**
 * FamilyKit — les briques d'interface des écrans Famille.
 *
 * Les 21 écrans du dossier `stitch_monochrome_pink_ui_kit/m*` partagent le même
 * vocabulaire visuel : une carte de section, une tuile de statistique, un
 * avatar d'initiale, une barre de progression, un sélecteur segmenté. Ces
 * briques sont écrites **une seule fois** ici pour que les écrans restent des
 * écrans et que les écarts entre eux se voient tout de suite.
 *
 * Aucune couleur littérale : tout passe par les jetons du thème actif
 * (`text-primary`, `bg-surface-tint`, `border-border`, …), donc un changement
 * de preset ou de thème image se propage sans retoucher un écran.
 */

import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DuoIcon } from '@/components/ui/DuoIcon';
import type { Icon as IconSvgElement } from '@solar-icons/react/lib/types';
import {
  ChampionIcon,
  FireIcon,
  Home01Icon,
  Settings01Icon,
  Time04Icon,
  UserMultiple02Icon,
} from '@/components/ui/solar-icons';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { cn } from '@/lib/utils';

/** Carte de section : titre, action éventuelle, contenu. */
export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('g2 p-4', className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="section-label">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Tuile de statistique : valeur forte, libellé discret. */
export function StatTile({
  value,
  label,
  hint,
  className,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl bg-surface-tint p-3 text-center', className)}>
      <p className="stat-value text-3xl">{value}</p>
      <p className="stat-label mt-1">{label}</p>
      {hint && <p className="mt-1 text-2xs text-text-muted">{hint}</p>}
    </div>
  );
}

/** Avatar d'initiale, teinté par l'accent du thème. */
export function MemberAvatar({
  name,
  size = 40,
  muted = false,
  className,
}: {
  name: string;
  size?: number;
  muted?: boolean;
  className?: string;
}) {
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        muted ? 'bg-surface-tint text-text-muted' : 'bg-primary text-on-primary',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

/** Barre de progression accessible (valeur annoncée, pas seulement peinte). */
export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-tint', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${pct}%`}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${pct}%`, transitionDuration: 'var(--motion-slow)', transitionTimingFunction: 'var(--ease-standard)' }}
      />
    </div>
  );
}

/** Sélecteur segmenté — un seul choix actif, annoncé par `aria-pressed`. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      className="flex gap-1 rounded-full bg-surface-tint p-1"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              'flex min-h-9 flex-1 items-center justify-center rounded-full px-3 text-xs font-semibold',
              'transition-colors duration-[var(--motion-fast)]',
              active ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Ligne d'information : icône, libellé, valeur. */
export function InfoRow({
  icon,
  label,
  value,
  onClick,
  trailing,
}: {
  icon?: IconSvgElement;
  label: string;
  value?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      {icon && (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-tint text-primary">
          <DuoIcon icon={icon} size={16} />
        </span>
      )}
      <span className="flex-1 text-sm font-medium text-text-primary">{label}</span>
      {value !== undefined && <span className="text-sm text-text-muted">{value}</span>}
      {trailing}
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-3 py-2">{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2 text-left">
      {content}
    </button>
  );
}

/** Encart d'explication honnête : ce que l'écran montre, et d'où ça vient. */
export function HintNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-surface-tint px-3 py-2 text-xs leading-5 text-text-muted">
      {children}
    </p>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * V2 — le mode Famille comme une SECTION, pas comme huit pages isolées.
 *
 * L'audit de finition a montré trois écarts entre les 21 écrans :
 *   • aucun repère de navigation : depuis « Activité », rien n'indiquait
 *     qu'existaient « Défis », « Points » ou « Réglages » ;
 *   • chaque écran réinventait son en-tête de valeur (dégradé accent, chiffre
 *     gras sans-serif, anneau en conic-gradient) ;
 *   • les listes de membres étaient recopiées avec trois tailles d'avatar.
 * D'où quatre briques : `FamilySubnav`, `FamilyHero`, `MemberRow`, `MetricRow`.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Les six écrans de référence du mode Famille. */
const FAMILY_SECTIONS = [
  { to: '/family/home', key: 'familyPlus.overview', fallback: "Vue d'ensemble", icon: Home01Icon },
  { to: '/family/members', key: 'family.members', fallback: 'Membres', icon: UserMultiple02Icon },
  { to: '/family/challenges', key: 'familyPlus.challengesTitle', fallback: 'Défis', icon: ChampionIcon },
  { to: '/family/points', key: 'familyPlus.pointsTitle', fallback: 'Points', icon: FireIcon },
  { to: '/family/activity', key: 'familyPlus.activityTitle', fallback: 'Activité', icon: Time04Icon },
  { to: '/family/settings', key: 'familyPlus.familySettingsTitle', fallback: 'Réglages', icon: Settings01Icon },
] as const;

/**
 * Sous-navigation du mode Famille — un seul endroit pour passer d'une section
 * à l'autre. Elle défile horizontalement sur petit écran (jamais de retour à
 * la ligne qui casserait la pastille) et annonce la page courante via
 * `aria-current`, donc aussi aux lecteurs d'écran.
 */
export function FamilySubnav({ className }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      aria-label={t('familyPlus.sections', 'Sections de la famille')}
      className={cn('family-subnav g1', className)}
    >
      {FAMILY_SECTIONS.map((section) => {
        const active =
          pathname === section.to ||
          (section.to !== '/family/home' && pathname.startsWith(`${section.to}/`));
        return (
          <button
            key={section.to}
            type="button"
            onClick={() => navigate(section.to)}
            aria-current={active ? 'page' : undefined}
            className="family-subnav-item"
          >
            <DuoIcon icon={section.icon} size={15} />
            <span>{t(section.key, section.fallback)}</span>
          </button>
        );
      })}
    </nav>
  );
}

/**
 * En-tête de valeur du mode Famille : un libellé, un chiffre clé et son
 * unité, éventuellement un anneau de progression et une rangée d'avatars.
 *
 * Remplace le bloc « fond accent + chiffre gras + `conic-gradient` en style
 * inline » du hub : la valeur suit désormais `.stat-value` (serif, tabulaire,
 * accent lisible) et l'anneau utilise `ProgressRing`, qui est annoncé
 * (`role="img"` + libellé) au lieu d'un dégradé purement décoratif.
 */
export function FamilyHero({
  label,
  value,
  unit,
  caption,
  ring,
  ringLabel,
  avatars,
  footnote,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  caption?: string;
  ring?: number;
  ringLabel?: string;
  avatars?: ReactNode;
  footnote?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('g3 family-hero', className)}>
      <div className="family-hero-main">
        <p className="section-label">{label}</p>
        <p className="family-hero-value">
          <span className="stat-value">{value}</span>
          {unit && <span className="family-hero-unit">{unit}</span>}
        </p>
        {caption && <p className="family-hero-caption">{caption}</p>}
      </div>
      {ring !== undefined && (
        <ProgressRing
          value={ring}
          size={76}
          stroke={7}
          label={`${Math.round(ring)}%`}
          ariaLabel={ringLabel ?? label}
          className="family-hero-ring"
        />
      )}
      {avatars && <div className="family-hero-avatars">{avatars}</div>}
      {footnote && <p className="family-hero-foot">{footnote}</p>}
    </section>
  );
}

/**
 * Ligne de membre : avatar, nom, méta, valeur de fin. Rendue en `<button>`
 * quand elle mène quelque part, en `<div>` sinon — l'écran ne décide plus de
 * la sémantique ni de la taille d'avatar.
 */
export function MemberRow({
  name,
  meta,
  trailing,
  avatarSize = 40,
  muted = false,
  onClick,
  className,
}: {
  name: string;
  meta?: ReactNode;
  trailing?: ReactNode;
  avatarSize?: number;
  muted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <MemberAvatar name={name} size={avatarSize} muted={muted} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">{name}</span>
        {meta && <span className="mt-0.5 block truncate text-xs text-text-muted">{meta}</span>}
      </span>
      {trailing}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn('family-member-row', className)}
      >
        {content}
      </button>
    );
  }
  return <div className={cn('family-member-row', className)}>{content}</div>;
}

/** Ligne « libellé → valeur », avec barre facultative. */
export function MetricRow({
  label,
  value,
  progress,
  progressLabel,
}: {
  label: ReactNode;
  value: ReactNode;
  progress?: number;
  progressLabel?: string;
}) {
  return (
    <div className="family-metric">
      <div className="family-metric-head">
        <span className="family-metric-label">{label}</span>
        <span className="family-metric-value">{value}</span>
      </div>
      {progress !== undefined && (
        <ProgressBar
          className="mt-2"
          value={progress}
          label={progressLabel ?? (typeof label === 'string' ? label : '')}
        />
      )}
    </div>
  );
}
