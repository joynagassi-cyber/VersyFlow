/**
 * Scènes chrétiennes & d'architecture sacrée — source de vérité unique.
 *
 * Conçues après analyse des collections architecturales de WallpapersHome
 * (`Architecture / Classical`, `Houses and Exteriors`, `Coastal`, `Modern`),
 * en écartant tout motif sombre/Halloween/nocturne inapproprié et en orientant
 * résolument l'ensemble vers la foi chrétienne, la victoire du Christ et la
 * beauté paisible des sanctuaires.
 *
 * Chaque scène possède deux cadrages distincts :
 *  - paysage 3:2 (1248 × 832) pour le bureau ;
 *  - portrait 2:3 (832 × 1248) pour le mobile.
 *
 * Toutes les couleurs d'accent de repli proviennent des jetons existants du
 * catalogue de base (`src/theme/theme-catalog.ts`).
 */

export const SACRED_SCENES = [
  /* ------------------------ Foi & Victoire du Christ (5) ------------------- */
  {
    id: 'chr-victoire-croix',
    name: 'Victoire à la Croix',
    category: 'foi-victoire',
    color: '#B9770E',
    motif: 'la croix vide victorieuse au lever du soleil sur Golgotha, rayons dorés sur Jérusalem',
    scene:
      'empty wooden cross of Jesus standing victorious atop Golgotha hill at sunrise, glorious golden sunbeams breaking through parted clouds above ancient Jerusalem limestone walls and olive trees',
  },
  {
    id: 'chr-tombeau-ouvert',
    name: 'Tombeau vide à l’aube',
    category: 'foi-victoire',
    color: '#E67E22',
    motif: 'matin de la Résurrection, pierre roulée et lumière dorée jaillissant du tombeau ouvert',
    scene:
      'empty rock-hewn Garden Tomb on Resurrection morning with the round stone rolled aside, warm dawn light radiating from inside onto white linen, blooming white lilies and olive branches',
  },
  {
    id: 'chr-bon-berger',
    name: 'Le Bon Berger',
    category: 'foi-victoire',
    color: '#27AE60',
    motif: 'verts pâturages et eaux paisibles du Psaume 23 au soleil levant',
    scene:
      'serene Galilean green hills and still reflective waters at sunrise inspired by Psalm 23, white sheep grazing peacefully beside a stone shepherd path and ancient olive trees',
  },
  {
    id: 'chr-gethsemane',
    name: 'Jardin de Gethsémané',
    category: 'foi-victoire',
    color: '#1B4F72',
    motif: 'oliviers millénaires sous un rayon céleste dans la nuit étoilée face à Jérusalem',
    scene:
      'ancient gnarled olive trees in the Garden of Gethsemane under a starry sapphire sky, gentle silver-gold celestial ray of light over a stone prayer rock, warm distant glow on Jerusalem walls',
  },
  {
    id: 'chr-mer-galilee',
    name: 'Paix sur la Galilée',
    category: 'foi-victoire',
    color: '#1F618D',
    motif: 'barque paisible sur la mer de Galilée apaisée sous les nuages entrouverts à l’aube',
    scene:
      'traditional wooden boat resting on mirror-calm turquoise waters of the Sea of Galilee as storm clouds part to reveal radiant golden morning sunbeams',
  },

  /* ---------------------- Architecture & Sanctuaires (8) ------------------- */
  {
    id: 'arc-cathedrale-lumiere',
    name: 'Nef de lumière',
    category: 'architecture-sacree',
    color: '#B7950B',
    motif: 'faisceaux de lumière dorée traversant les hautes fenêtres d’une nef de pierre',
    scene:
      'soaring stone cathedral nave with warm golden volumetric sunlight streaming diagonally through high arched clerestory windows onto limestone vaults',
  },
  {
    id: 'arc-vitrail-grace',
    name: 'Rosace & Vitrail',
    category: 'architecture-sacree',
    color: '#8E44AD',
    motif: 'grande rosace gothique et vitraux aux éclats saphir, ambre et rubis',
    scene:
      'intricate cathedral stained-glass rose and lancet windows glowing with jewel-toned sapphire, ruby, and amber light inside carved stone architecture',
  },
  {
    id: 'arc-chapelle-colline',
    name: 'Chapelle des collines',
    category: 'architecture-sacree',
    color: '#1E8449',
    motif: 'chapelle immaculée et clocher surmonté d’une croix au cœur de collines verdoyantes',
    scene:
      'serene small white country chapel with a cross nestled on a lush green hillside with misty mountain peaks in soft daylight',
  },
  {
    id: 'arc-cloitre-olivier',
    name: 'Cloître & Arches',
    category: 'architecture-sacree',
    color: '#27AE60',
    motif: 'voûtes gothiques et colonnades de pierre blonde baignées d’ombre et de soleil',
    scene:
      'peaceful stone monastery cloister walkway with rhythmic arched columns and warm golden sunlight casting calm shadows across stone flagstones',
  },
  {
    id: 'arc-chapelle-cotiere',
    name: 'Chapelle sur la mer',
    category: 'architecture-sacree',
    color: '#1565C0',
    motif: 'chapelle blanche couronnée d’une croix dominant une mer d’azur paisible',
    scene:
      'whitewashed coastal chapel topped with a simple cross overlooking tranquil deep blue sea waters under clear Mediterranean light',
  },
  {
    id: 'arc-maison-paisible',
    name: 'Demeure paisible',
    category: 'architecture-sacree',
    color: '#CA6F1E',
    motif: 'demeure de pierre et de bois au pied des montagnes dans une lumière d’automne',
    scene:
      'peaceful stone and timber countryside home nestled among golden autumn trees and green pines beneath calm mountain peaks',
  },
  {
    id: 'arc-sanctuaire-bois',
    name: 'Sanctuaire & Recueillement',
    category: 'architecture-sacree',
    color: '#6E2C00',
    motif: 'bancs de bois et nef silencieuse baignés d’une douce lumière matinale',
    scene:
      'quiet wooden church pews and warm stone sanctuary interior bathed in gentle morning sunlight inviting prayer and scripture meditation',
  },
  {
    id: 'arc-arche-jerusalem',
    name: 'Pierres de Jérusalem',
    category: 'architecture-sacree',
    color: '#A04000',
    motif: 'arches de pierre blonde et cour pavée ensoleillée d’inspiration biblique',
    scene:
      'ancient golden limestone archway opening onto a sunlit cobblestone courtyard, timeless biblical architectural heritage',
  },
];

export const SACRED_SIZES = {
  landscape: { width: 1248, height: 832 },
  portrait: { width: 832, height: 1248 },
  thumb: { width: 320 },
};

export function buildSacredPrompt(scene, format) {
  const base = `${scene.scene}, clean luminous editorial composition, reverent Christian atmosphere, rich natural light`;
  const common =
    'no text, no logo, no watermark, no brand, no identifiable face in focus, uncluttered composition with calm negative space for UI overlays';
  const framing =
    format === 'landscape'
      ? 'horizontal 3:2 landscape composition, subject balanced on the right, calm area on the left for interface text'
      : 'vertical 2:3 portrait composition, subject in the upper two-thirds, calm darker area at the bottom for interface text';
  return `${base}, ${framing}, ${common}`;
}
