/** Types du module JS partagé `sacred-scenes.mjs` (script + tests). */
export type SacredSceneFormat = 'landscape' | 'portrait';

export interface SacredScene {
  id: string;
  name: string;
  category: 'foi-victoire' | 'architecture-sacree';
  color: string;
  motif: string;
  scene: string;
}

export declare const SACRED_SCENES: SacredScene[];

export declare const SACRED_SIZES: {
  landscape: { width: number; height: number };
  portrait: { width: number; height: number };
  thumb: { width: number };
};

export declare function buildSacredPrompt(scene: SacredScene, format: SacredSceneFormat): string;
