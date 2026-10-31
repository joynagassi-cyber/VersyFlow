/**
 * Les 20 scènes photo demandées — source de vérité unique.
 *
 * Chaque scène est déclinée en **deux cadrages volontairement différents** :
 *  - paysage 3:2 (1248 × 832) pour le bureau ;
 *  - portrait 2:3 (832 × 1248) pour le mobile.
 * Le cadrage portrait n'est pas un recadrage du paysage : les prompts le
 * décrivent séparément (sujet recentré, espace calme en bas pour le texte).
 *
 * Contraintes communes à tous les prompts :
 *  - photoréaliste, lumière douce, composition calme ;
 *  - **aucun texte, logo, filigrane, visage identifiable au premier plan** ;
 *  - zones sombres/unies pour que le voile et les cartes restent lisibles.
 *
 * Utilisé par `import-photo-themes.mjs` et repris dans
 * `docs/design/photo-themes.md`.
 */

export const PHOTO_SCENES = [
  /* ------------------------------ Nature (10) ------------------------------ */
  {
    id: 'pho-feuilles',
    name: 'Feuillages superposés',
    category: 'photos-nature',
    color: '#1E8449',
    motif: 'feuilles épaisses vert vif superposées, lumière douce, arrière-plan sombre',
    scene:
      'thick vivid green leaves layered in an artistic overlapping composition, soft natural daylight, shallow depth of field, deep dark green background',
  },
  {
    id: 'pho-aurore',
    name: 'Aurore boréale',
    category: 'photos-nature',
    color: '#0E6655',
    motif: 'aurore boréale verte au-dessus d’un lac et de montagnes enneigées',
    scene:
      'green and teal aurora borealis above a still lake and snowy mountains, starry night sky, long exposure, calm water reflections',
  },
  {
    id: 'pho-foret-brume',
    name: 'Forêt brumeuse',
    category: 'photos-nature',
    color: '#1E8449',
    motif: 'sous-bois brumeux au lever du jour, faisceaux de lumière',
    scene:
      'misty temperate forest at sunrise, soft light rays through tall trees, damp moss, muted greens, quiet atmosphere',
  },
  {
    id: 'pho-cascade',
    name: 'Cascade',
    category: 'photos-nature',
    color: '#0E6655',
    motif: 'cascade dans une forêt, rochers couverts de mousse',
    scene:
      'small waterfall in a green forest, moss covered rocks, silky flowing water, soft overcast light',
  },
  {
    id: 'pho-dunes',
    name: 'Dunes au coucher du soleil',
    category: 'photos-nature',
    color: '#B9770E',
    motif: 'dunes de sable et leurs ondulations à la lumière dorée',
    scene:
      'sand dunes with smooth wind shaped ridges at golden hour, warm soft light, long shadows, minimalist desert landscape',
  },
  {
    id: 'pho-lac',
    name: 'Lac de montagne',
    category: 'photos-nature',
    color: '#1B4F72',
    motif: 'lac calme et reflets de montagnes à l’aube',
    scene:
      'calm alpine lake mirroring mountains at dawn, cold blue tones, thin mist over the water',
  },
  {
    id: 'pho-vague',
    name: 'Vague déferlante',
    category: 'photos-nature',
    color: '#21618C',
    motif: 'vague qui déferle, écume et lumière rasante',
    scene:
      'breaking ocean wave with white foam, backlit by low sun, deep blue water, dynamic but uncluttered',
  },
  {
    id: 'pho-lavande',
    name: 'Champ de lavande',
    category: 'photos-nature',
    color: '#566573',
    motif: 'rangées de lavande au crépuscule, ciel doux',
    scene:
      'rows of lavender fields at dusk, soft violet blue sky, distant hills, gentle light, wide open space',
  },
  {
    id: 'pho-falaise',
    name: 'Falaise côtière',
    category: 'photos-nature',
    color: '#283747',
    motif: 'falaises et océan, embruns, lumière grise',
    scene:
      'dramatic coastal cliffs above a deep blue ocean, sea spray, overcast silver light, moody calm',
  },
  {
    id: 'pho-coquelicots',
    name: 'Coquelicots',
    category: 'photos-nature',
    color: '#B03A2E',
    motif: 'champ de coquelicots rouges dans une lumière chaude',
    scene:
      'field of red poppies in warm evening light, shallow depth of field, soft blurred background, gentle breeze',
  },

  /* ---------------------------- Vie / loisirs (10) -------------------------- */
  {
    id: 'pho-voiture',
    name: 'Voiture de sport',
    category: 'photos-vie',
    color: '#B03A2E',
    motif: 'voiture de sport élégante, reflets de carrosserie, route déserte',
    scene:
      'elegant red sports car on an empty mountain road at golden hour, glossy reflections, low camera angle, no visible brand logo',
  },
  {
    id: 'pho-football',
    name: 'Football',
    category: 'photos-vie',
    color: '#1E8449',
    motif: 'ballon sur la pelouse d’un stade, lumière de fin de journée',
    scene:
      'football on the grass of a stadium pitch, late afternoon light, goal net softly blurred in the background, no advertising, no team logo',
  },
  {
    id: 'pho-cafe-livre',
    name: 'Café & livre',
    category: 'photos-vie',
    color: '#B9770E',
    motif: 'tasse de café et livre ouvert sur une table en bois',
    scene:
      'coffee cup and open book on a wooden table by a window, warm morning light, shallow depth of field, cozy and quiet',
  },
  {
    id: 'pho-velo',
    name: 'Vélo en ville',
    category: 'photos-vie',
    color: '#21618C',
    motif: 'vélo posé contre un mur de ville au soleil',
    scene:
      'bicycle leaning against a sunlit city wall, spring morning, soft shadows, European street, no signage text',
  },
  {
    id: 'pho-table',
    name: 'Table partagée',
    category: 'photos-vie',
    color: '#CA6F1E',
    motif: 'table de repas vue du dessus, plats simples à partager',
    scene:
      'overhead view of a shared meal table, simple dishes, bread and fruit, warm natural light, hands out of frame',
  },
  {
    id: 'pho-surf',
    name: 'Surf',
    category: 'photos-vie',
    color: '#1565C0',
    motif: 'planche de surf et océan au lever du jour',
    scene:
      'surfboard planted in the sand facing a calm ocean at sunrise, warm light, distant waves, no text on the board',
  },
  {
    id: 'pho-randonnee',
    name: 'Randonnée',
    category: 'photos-vie',
    color: '#1E8449',
    motif: 'sentier de montagne et sac à dos, horizon dégagé',
    scene:
      'hiking trail through green hills, backpack resting on a rock, expansive horizon, soft daylight, no people faces',
  },
  {
    id: 'pho-cuisine',
    name: 'Cuisine',
    category: 'photos-vie',
    color: '#CA6F1E',
    motif: 'plan de travail, ingrédients frais, préparation en cours',
    scene:
      'kitchen counter with fresh ingredients and a cutting board, hands preparing vegetables, warm home light, no packaging text',
  },
  {
    id: 'pho-bibliotheque',
    name: 'Bibliothèque',
    category: 'photos-vie',
    color: '#6E2C00',
    motif: 'étagères de livres anciens, lumière chaude et poussière en suspens',
    scene:
      'old wooden bookshelves filled with books, warm lamp light, dust in the air, calm library atmosphere, no readable titles',
  },
  {
    id: 'pho-guitare',
    name: 'Guitare acoustique',
    category: 'photos-vie',
    color: '#6E2C00',
    motif: 'guitare acoustique dans une pièce calme, lumière de fin de jour',
    scene:
      'acoustic guitar resting on a chair in a quiet room, late afternoon light through curtains, warm tones, no brand logo',
  },
];

/** Cadrages attendus, en pixels (identiques aux thèmes existants). */
export const PHOTO_SIZES = {
  landscape: { width: 1248, height: 832 },
  portrait: { width: 832, height: 1248 },
  thumb: { width: 320 },
};

/**
 * Prompts complets. Le cadrage est décrit explicitement pour que les deux
 * formats d'une même scène soient cohérents **sans** être un simple
 * agrandissement/recadrage de l'autre.
 */
export function buildPrompt(scene, format) {
  const base = `${scene.scene}, photorealistic photography, high detail, natural colors, soft light, cinematic but calm`;
  const common =
    'no text, no logo, no watermark, no brand, no identifiable face in focus, uncluttered composition with calm negative space for UI overlays';
  const framing =
    format === 'landscape'
      ? 'horizontal 3:2 landscape composition, subject in the right half, darker quiet area on the left for interface text'
      : 'vertical 2:3 portrait composition, subject in the upper half, calm darker area at the bottom for interface text';
  return `${base}, ${framing}, ${common}`;
}
