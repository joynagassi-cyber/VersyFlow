/**
 * Coques d'appareils du laboratoire responsive (`/__dev/responsive-preview`).
 *
 * POURQUOI CES COQUES N'IMITENT RIEN
 * Une coque dessinée en CSS autour d'un aperçu rend la comparaison lisible :
 * on voit d'un coup d'œil ce qui relève du téléphone et ce qui relève du
 * bureau. Mais elle ne doit jamais *simuler* la mise en page : la largeur de
 * viewport interne de chaque iframe reste **390 px** ou **1440 px**, valeur
 * posée en style inline et jamais transformée. La coque vit à l'extérieur.
 *
 * COMMENT ÇA TIENT DANS LA PAGE
 * L'appareil est construit à sa taille naturelle (écran + bordure), puis
 * projeté avec `transform: scale()`. Une transformation CSS ne change pas la
 * largeur de mise en page : les media queries du produit continuent de voir
 * 390 px / 1440 px. Le conteneur, lui, réserve la place *après* projection
 * (taille naturelle × échelle) pour que la grille du laboratoire reste juste.
 *
 * Aucune donnée d'appareil n'est inventée : les dimensions affichées sont
 * celles réellement utilisées (390 × 844 et 1440 × 900), pas une fiche
 * technique de constructeur.
 */

export type DeviceRole = 'mobile' | 'desktop';

/** Épaisseurs des coques, en pixels de référence (avant projection). */
export const PHONE_CHROME = {
  /** Bordure noire autour de l'écran. */
  bezel: 12,
  /** Rayon extérieur de la coque. */
  outerRadius: 52,
  /** Rayon de l'écran (légèrement plus petit que la coque). */
  screenRadius: 40,
} as const;

export const DESKTOP_CHROME = {
  bezel: 14,
  /** Menton sous l'écran (le bandeau noir typique d'un moniteur). */
  chin: 26,
  /** Bras du pied. */
  neck: 62,
  /** Semelle du pied. */
  base: 10,
  outerRadius: 16,
  screenRadius: 6,
} as const;

/**
 * Taille extérieure de l'appareil, écran + coque (+ pied pour le bureau).
 * Fonction pure : c'est elle que le laboratoire utilise pour réserver la place
 * et pour calculer l'échelle, donc elle est testable sans DOM.
 */
export function deviceOuterSize(
  role: DeviceRole,
  screenWidth: number,
  screenHeight: number,
): { width: number; height: number } {
  if (role === 'mobile') {
    return {
      width: screenWidth + PHONE_CHROME.bezel * 2,
      height: screenHeight + PHONE_CHROME.bezel * 2,
    };
  }
  return {
    width: screenWidth + DESKTOP_CHROME.bezel * 2,
    height:
      screenHeight +
      DESKTOP_CHROME.bezel * 2 +
      DESKTOP_CHROME.chin +
      DESKTOP_CHROME.neck +
      DESKTOP_CHROME.base,
  };
}

/**
 * Échelle de projection : la plus petite des deux contraintes (largeur de la
 * colonne, hauteur visible), bornée à 1 (jamais d'agrandissement) et à un
 * plancher pour qu'un appareil ne devienne pas illisible.
 *
 * Fonction pure : le laboratoire l'appelle, les tests la vérifient sans DOM.
 */
export function fitScale(
  role: DeviceRole,
  screenWidth: number,
  screenHeight: number,
  options: { availableWidth: number; availableHeight: number; min?: number },
): number {
  const outer = deviceOuterSize(role, screenWidth, screenHeight);
  const min = options.min ?? 0.2;
  const byWidth = (options.availableWidth - 16) / outer.width;
  const byHeight = (options.availableHeight - 16) / outer.height;
  return Math.min(1, Math.max(min, Math.min(byWidth, byHeight)));
}

const SHELL_BG = 'linear-gradient(160deg, #23232a 0%, #141417 42%, #050506 100%)';

/** Coque de téléphone : bordure, boutons latéraux, encoche, indicateur. */
function PhoneChrome({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const sideButton = (top: number, h: number, side: 'left' | 'right') => (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        top,
        [side]: -2,
        width: 3,
        height: h,
        borderRadius: 2,
        background: '#2c2c33',
        boxShadow: 'inset 0 0 1px rgba(255,255,255,0.25)',
      }}
    />
  );

  return (
    <div
      data-device="phone"
      style={{
        position: 'relative',
        padding: PHONE_CHROME.bezel,
        borderRadius: PHONE_CHROME.outerRadius,
        background: SHELL_BG,
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.18) inset, 0 24px 48px -18px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.28)',
      }}
    >
      {sideButton(140, 26, 'left')}
      {sideButton(182, 48, 'left')}
      {sideButton(240, 48, 'left')}
      {sideButton(196, 74, 'right')}

      <div
        style={{
          position: 'relative',
          width,
          height,
          borderRadius: PHONE_CHROME.screenRadius,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        {children}

        {/* Encoche / îlot : purement décorative, jamais cliquable. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 112,
            height: 30,
            borderRadius: 999,
            background: '#000',
            boxShadow: '0 1px 2px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 132,
            height: 5,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.72)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

/** Écran de bureau : moniteur + pied, sans marque de constructeur. */
function DesktopChrome({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  return (
    <div data-device="monitor" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          padding: DESKTOP_CHROME.bezel,
          paddingBottom: DESKTOP_CHROME.bezel + DESKTOP_CHROME.chin,
          borderRadius: DESKTOP_CHROME.outerRadius,
          background: SHELL_BG,
          boxShadow: '0 1px 0 rgba(255,255,255,0.14) inset, 0 30px 60px -24px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width,
            height,
            borderRadius: DESKTOP_CHROME.screenRadius,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {children}
        </div>
        {/* Menton + témoin d'alimentation. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: DESKTOP_CHROME.bezel / 2 - 1,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 5,
            height: 5,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.28)',
          }}
        />
      </div>

      {/* Bras puis semelle : deux blocs, pour que le pied ne soit pas un
          rectangle plein sous l'écran entier. */}
      <div
        aria-hidden="true"
        style={{
          width: 132,
          height: DESKTOP_CHROME.neck,
          margin: '0 auto',
          background: 'linear-gradient(180deg, #1b1b20 0%, #101013 100%)',
          clipPath: 'polygon(18% 0, 82% 0, 100% 100%, 0 100%)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          width: 320,
          height: DESKTOP_CHROME.base,
          margin: '0 auto',
          borderRadius: 999,
          background: 'linear-gradient(180deg, #26262c 0%, #131316 100%)',
          boxShadow: '0 10px 18px -10px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  );
}

export interface DeviceCaseProps {
  role: DeviceRole;
  /** Largeur INTERNE de l'écran (viewport réel de l'iframe). */
  width: number;
  /** Hauteur INTERNE de l'écran. */
  height: number;
  /** Projection visuelle, sans effet sur la largeur interne. */
  scale: number;
  children: React.ReactNode;
}

/**
 * L'appareil entier, projeté. Le conteneur réserve la place *après*
 * projection ; l'écran garde sa taille de référence.
 */
export function DeviceCase({ role, width, height, scale, children }: DeviceCaseProps) {
  const outer = deviceOuterSize(role, width, height);
  return (
    <div style={{ width: outer.width * scale, height: outer.height * scale }}>
      <div
        style={{
          width: outer.width,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {role === 'mobile' ? (
          <PhoneChrome width={width} height={height}>
            {children}
          </PhoneChrome>
        ) : (
          <DesktopChrome width={width} height={height}>
            {children}
          </DesktopChrome>
        )}
      </div>
    </div>
  );
}
