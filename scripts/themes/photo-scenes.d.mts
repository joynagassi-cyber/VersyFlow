/** Types du module JS partagé `photo-scenes.mjs` (script + tests). */
export type PhotoSceneFormat = 'landscape' | 'portrait';

export interface PhotoScene {
  id: string;
  name: string;
  category: 'photos-nature' | 'photos-vie';
  color: string;
  motif: string;
  scene: string;
}

export declare const PHOTO_SCENES: PhotoScene[];

export declare const PHOTO_SIZES: {
  landscape: { width: number; height: number };
  portrait: { width: number; height: number };
  thumb: { width: number };
};

export declare function buildPrompt(scene: PhotoScene, format: PhotoSceneFormat): string;
