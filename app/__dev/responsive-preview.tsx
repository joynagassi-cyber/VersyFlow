/**
 * Laboratoire de prévisualisation responsive — `/__dev/responsive-preview`.
 *
 * Objectif : voir **en même temps** l'interface mobile et l'interface de bureau
 * réelles de VersyFlow, et constater immédiatement qu'une modification ne
 * casse pas l'autre.
 *
 * Comment les deux rendus sont isolés :
 *  - deux `<iframe>` chargent `preview-frame.html`, une page **dev only** qui
 *    donne à chacune une largeur de viewport réelle (390 px et 1440 px). Les
 *    media queries du produit (`768 px`, `1024 px`) se déclenchent donc
 *    vraiment : le bureau n'est pas imité par une transformation CSS ;
 *  - `preview-frame.html` remplace `localStorage` par une mémoire jetable
 *    avant tout module : aucune écriture n'atteint le compte de l'utilisateur,
 *    et les deux frames ne partagent aucune donnée ;
 *  - `preview-session.ts` sème un jeu de démonstration déterministe (profil
 *    « Léa », famille « Famille Étoile », thème `quantum-rose`).
 *
 * Ce que montre la page : chaque aperçu est posé dans une **coque d'appareil**
 * (`src/dev/device-frames.tsx`) — un téléphone pour le mobile, un écran avec
 * son pied pour le bureau. La coque est un décor extérieur : la largeur
 * interne des iframes reste 390 px / 1440 px, et c'est la coque entière qui
 * est projetée (`transform: scale`), jamais l'iframe.
 *
 * Ce qui est synchronisé : la **route** choisie ici, le **thème** appliqué ici,
 * et le **rechargement**. Ce qui ne l'est pas : les saisies, les sessions de
 * mémorisation, toute mutation métier — c'est volontaire, un laboratoire ne
 * doit pas jouer deux fois la même écriture.
 *
 * Ce fichier n'existe pas en production : la route est enregistrée sous
 * `import.meta.env.DEV` dans `src/main.tsx`, et le build ne le contient pas.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowLeft01Icon as Back,
  RefreshIcon as Reload,
  SmartPhone01Icon as Phone,
  ComputerIcon as Desktop,
  CheckmarkCircle02Icon as Ok,
  AlertCircleIcon as Warn,
  LockIcon as Lock,
  Link01Icon as External,
} from '@hugeicons/core-free-icons';
import { useAppearanceStore } from '@/store/appearance-store';
import { PREVIEW_SCREENS, DEFAULT_PREVIEW_SCREEN, type PreviewScreen } from '@/dev/preview-screens';
import { DeviceCase, fitScale } from '@/dev/device-frames';
import { cn } from '@/lib/utils';

type Role = 'mobile' | 'desktop';

interface FrameSpec {
  role: Role;
  label: string;
  width: number;
  height: number;
  icon: typeof Phone;
}

/**
 * Dimensions de référence. Ce ne sont pas des contraintes universelles : le
 * cadre se réduit visuellement (`transform: scale`) pour tenir dans la place
 * disponible, sans jamais changer la largeur **interne** (c'est elle qui
 * déclenche les media queries).
 */
const FRAMES: FrameSpec[] = [
  { role: 'mobile', label: 'Mobile', width: 390, height: 844, icon: Phone },
  { role: 'desktop', label: 'Bureau', width: 1440, height: 900, icon: Desktop },
];

interface FrameStatus {
  ready: boolean;
  isolated: boolean | null;
  path: string | null;
}

const EMPTY_STATUS: Record<Role, FrameStatus> = {
  mobile: { ready: false, isolated: null, path: null },
  desktop: { ready: false, isolated: null, path: null },
};

/** Sous-ensemble d'apparence transmis aux frames (le thème, rien d'autre). */
function appearancePayload() {
  const s = useAppearanceStore.getState();
  return {
    themeMode: s.themeMode,
    accent: s.accent,
    presetId: s.presetId,
    backgroundType: s.backgroundType,
    gradientId: s.gradientId,
    colorThemeId: s.colorThemeId,
    uiFontId: s.uiFontId,
    reducedTransparency: s.reducedTransparency,
    highContrast: s.highContrast,
    bibleFontSize: s.bibleFontSize,
    bibleLineHeight: s.bibleLineHeight,
    showVerseNumbers: s.showVerseNumbers,
  };
}

/**
 * Un cadre mis à l'échelle : la taille interne reste celle du viewport visé,
 * seule la projection visuelle change.
 */
function ScaledFrame({
  spec,
  screen,
  frozen,
  status,
  onToggleFreeze,
  onReload,
  onLoaded,
  iframeRef,
}: {
  spec: FrameSpec;
  screen: string;
  frozen: boolean;
  status: FrameStatus;
  onToggleFreeze: () => void;
  onReload: () => void;
  onLoaded: () => void;
  iframeRef: (node: HTMLIFrameElement | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  // Hauteur de fenêtre suivie : un téléphone de 868 px de haut ne rentre pas
  // dans un panneau de 400 px. Sans cette borne, on ne voyait que le haut de
  // la coque et l'aperçu semblait « ne pas s'afficher ».
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === 'undefined' ? 900 : window.innerHeight,
  );

  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    // L'échelle se calcule sur la taille de l'APPAREIL (écran + coque) :
    // l'écran, lui, garde sa largeur interne de référence.
    const compute = () => {
      const available = element.clientWidth;
      if (available <= 0) return;
      // Deux contraintes : la largeur de la colonne et la hauteur visible
      // (barres du laboratoire déduites, 270 px). On prend la plus petite des
      // deux, pour que la coque ENTIÈRE soit visible sans défiler.
      const next = fitScale(spec.role, spec.width, spec.height, {
        availableWidth: available,
        availableHeight: viewportHeight - 270,
      });
      setScale((current) => (Math.abs(current - next) > 0.01 ? next : current));
    };
    compute();
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(compute);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [spec.role, spec.width, spec.height, viewportHeight]);

  // La source de la frame ne change JAMAIS après le montage : la navigation
  // passe par `postMessage`. Sinon un cadre « gelé » se rechargerait quand
  // même à chaque changement de sélection, et l'isolation par rechargement
  // prendrait le pas sur la comparaison en cours.
  const [src] = useState(
    () => `/preview-frame.html?preview=${spec.role}&screen=${encodeURIComponent(screen)}`,
  );

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <header className="flex flex-wrap items-center gap-2">
        <DuoIcon icon={spec.icon} size={18} className="text-primary" />
        <h2 className="text-sm font-bold text-text-primary">{spec.label}</h2>
        <span className="text-[11px] font-semibold text-text-muted">
          {spec.role === 'mobile' ? 'dans une coque de téléphone' : 'dans un écran de bureau'}
        </span>
        <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
          {spec.width} × {spec.height} px · {Math.round(scale * 100)} %
        </span>

        {status.isolated === true && (
          <span className="flex items-center gap-1 rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-success">
            <DuoIcon icon={Ok} size={12} />
            stockage isolé
          </span>
        )}
        {status.isolated === false && (
          <span className="flex items-center gap-1 rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-error">
            <DuoIcon icon={Warn} size={12} />
            stockage non isolé — app non démarrée
          </span>
        )}
        {status.isolated === null && (
          <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-text-muted">
            en attente
          </span>
        )}

        <span className="ms-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleFreeze}
            aria-pressed={frozen}
            className={cn(
              'rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors',
              frozen
                ? 'bg-primary text-on-primary'
                : 'bg-surface-tint text-text-secondary hover:text-text-primary',
            )}
          >
            {frozen ? 'gelé' : 'suit la sélection'}
          </button>
          <button
            type="button"
            onClick={onReload}
            aria-label={`Recharger le cadre ${spec.label}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-tint hover:text-text-primary"
          >
            <DuoIcon icon={Reload} size={15} />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label={`Ouvrir le cadre ${spec.label} dans un onglet`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-tint hover:text-text-primary"
          >
            <DuoIcon icon={External} size={15} />
          </a>
        </span>
      </header>

      <p className="truncate text-[11px] text-text-muted">
        {status.path ?? '—'} · <span className="tabular-nums">{spec.width} px</span> de viewport
        interne
      </p>

      <div ref={wrapperRef} className="flex w-full justify-center">
        {/* Coque de téléphone ou écran de bureau : décor autour de l'écran.
            L'iframe garde exactement `spec.width` px de largeur interne, donc
            les media queries du produit se déclenchent pour de vrai. */}
        <DeviceCase role={spec.role} width={spec.width} height={spec.height} scale={scale}>
          <iframe
            ref={iframeRef}
            src={src}
            onLoad={onLoaded}
            title={`Prévisualisation ${spec.label} — ${spec.width} px`}
            className="border-0 bg-background"
            style={{ width: spec.width, height: spec.height, display: 'block' }}
          />
        </DeviceCase>

        <p className="mt-2 text-center text-[11px] text-text-muted">
          {spec.role === 'mobile'
            ? 'Coque de téléphone — la version mobile y tourne sur 390 px de large'
            : 'Écran de bureau — la version desktop y tourne sur 1440 px de large'}
        </p>
      </div>
    </section>
  );
}

export default function ResponsivePreviewPage() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<PreviewScreen['path']>(DEFAULT_PREVIEW_SCREEN);
  const [current, setCurrent] = useState<PreviewScreen | undefined>(
    PREVIEW_SCREENS.find((entry) => entry.path === DEFAULT_PREVIEW_SCREEN),
  );
  const [frozen, setFrozen] = useState<Record<Role, boolean>>({ mobile: false, desktop: false });
  const [status, setStatus] = useState<Record<Role, FrameStatus>>(EMPTY_STATUS);

  const frameRefs = useRef<Record<Role, HTMLIFrameElement | null>>({ mobile: null, desktop: null });
  // Valeurs courantes lues dans l'écouteur de messages sans le réenregistrer.
  const screenRef = useRef(screen);
  const frozenRef = useRef(frozen);
  screenRef.current = screen;
  frozenRef.current = frozen;

  const post = useCallback((role: Role, message: Record<string, unknown>) => {
    const win = frameRefs.current[role]?.contentWindow;
    win?.postMessage(message, window.location.origin);
  }, []);

  const postAll = useCallback(
    (message: Record<string, unknown>, skip?: Role) => {
      for (const spec of FRAMES) {
        if (spec.role === skip) continue;
        post(spec.role, message);
      }
    },
    [post],
  );

  // Messages remontés par les frames (prêt, route courante, isolation).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; role?: Role; path?: string; isolated?: boolean };
      if (!data || typeof data.type !== 'string') return;
      const role = data.role;
      if (role !== 'mobile' && role !== 'desktop') return;
      const fromFrame = frameRefs.current[role]?.contentWindow;
      if (fromFrame && event.source !== fromFrame) return;

      if (data.type === 'vf:preview:ready') {
        setStatus((prev) => ({
          ...prev,
          [role]: { ready: true, isolated: data.isolated === true, path: data.path ?? null },
        }));
        // Le thème partagé est poussé dès que la frame est prête : les deux
        // cadres montrent donc toujours le même preset.
        post(role, { type: 'vf:preview:appearance', appearance: appearancePayload() });
        // Après un rechargement, la frame repart de sa source : on la remet
        // sur l'écran en cours de comparaison (sauf si elle est gelée).
        if (!frozenRef.current[role]) {
          post(role, { type: 'vf:preview:navigate', path: screenRef.current });
        }
      } else if (data.type === 'vf:preview:route') {
        setStatus((prev) => ({
          ...prev,
          [role]: { ...prev[role], path: data.path ?? prev[role].path },
        }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  // Toute modification de thème dans le laboratoire se propage aux deux cadres.
  useEffect(() => {
    const unsubscribe = useAppearanceStore.subscribe(() => {
      postAll({ type: 'vf:preview:appearance', appearance: appearancePayload() });
    });
    return unsubscribe;
  }, [postAll]);

  const selectScreen = (path: string) => {
    const entry = PREVIEW_SCREENS.find((item) => item.path === path);
    setScreen(path);
    setCurrent(entry);
    setStatus((prev) => ({
      mobile: { ...prev.mobile, path: frozen.mobile ? prev.mobile.path : path },
      desktop: { ...prev.desktop, path: frozen.desktop ? prev.desktop.path : path },
    }));
    if (!frozen.mobile) post('mobile', { type: 'vf:preview:navigate', path });
    if (!frozen.desktop) post('desktop', { type: 'vf:preview:navigate', path });
  };

  const reloadAll = () => postAll({ type: 'vf:preview:reload' });

  const resetFrames = () => {
    setFrozen({ mobile: false, desktop: false });
    selectScreen(DEFAULT_PREVIEW_SCREEN);
    // `selectScreen` lit l'état `frozen` d'avant : on repousse explicitement.
    post('mobile', { type: 'vf:preview:navigate', path: DEFAULT_PREVIEW_SCREEN });
    post('desktop', { type: 'vf:preview:navigate', path: DEFAULT_PREVIEW_SCREEN });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {/* Barre du laboratoire */}
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Revenir à l’application"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-tint hover:text-text-primary"
        >
          <DuoIcon icon={Back} size={18} />
        </button>
        <div className="me-2">
          <h1 className="text-sm font-bold text-text-primary">Laboratoire responsive</h1>
          <p className="text-[11px] text-text-muted">
            Deux contextes réels · données de démonstration · aucun compte touché
          </p>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          Écran
          <select
            value={screen}
            onChange={(event) => selectScreen(event.target.value)}
            className="h-9 min-w-[240px] rounded-xl border border-border bg-surface px-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {PREVIEW_SCREENS.map((entry) => (
              <option key={entry.id} value={entry.path}>
                {entry.group} · {entry.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ms-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={reloadAll}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-tint px-3 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            <DuoIcon icon={Reload} size={15} />
            Recharger les deux
          </button>
          <button
            type="button"
            onClick={resetFrames}
            className="h-9 rounded-xl bg-primary px-3 text-xs font-semibold text-on-primary hover:opacity-90"
          >
            Vue de comparaison standard
          </button>
        </div>
      </header>

      {/* Ce que l'écran sélectionné peut réellement montrer */}
      {current && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-2 text-[11px]">
          <span className="font-semibold text-text-primary">{current.path}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 font-semibold',
              current.state === 'donnees-reelles' && 'bg-surface-tint text-success',
              current.state === 'etat-vide-reel' && 'bg-surface-tint text-warning',
              current.state === 'necessite-session' && 'bg-surface-tint text-text-secondary',
            )}
          >
            {current.state === 'donnees-reelles'
              ? 'données de démonstration'
              : current.state === 'etat-vide-reel'
                ? 'état vide réel'
                : 'session requise'}
          </span>
          {current.note && <span className="text-text-muted">{current.note}</span>}
        </div>
      )}

      {/* Les deux cadres */}
      <div className="flex min-h-0 flex-1 flex-wrap gap-4 overflow-auto p-4">
        {FRAMES.map((spec) => (
          <ScaledFrame
            key={spec.role}
            spec={spec}
            screen={screen}
            frozen={frozen[spec.role]}
            status={status[spec.role]}
            onToggleFreeze={() =>
              setFrozen((prev) => ({ ...prev, [spec.role]: !prev[spec.role] }))
            }
            onReload={() => post(spec.role, { type: 'vf:preview:reload' })}
            onLoaded={() => post(spec.role, { type: 'vf:preview:hello' })}
            iframeRef={(node) => {
              frameRefs.current[spec.role] = node;
            }}
          />
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-surface px-4 py-2 text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <DuoIcon icon={Lock} size={12} />
          Chaque cadre a son propre stockage en mémoire : rien n’est écrit sur le compte réel.
        </span>
        <span>Navigation, thème et rechargement sont synchronisés — pas les saisies.</span>
        <span className="ms-auto">Outil de développement : absent du build de production.</span>
      </footer>
    </div>
  );
}
