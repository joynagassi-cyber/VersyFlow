#!/usr/bin/env node
/**
 * Agnes image batch generator — 200 theme images (100 portrait + 100 landscape).
 *
 * 10 categories × 10 themes each. Each theme = 1 core color, which the
 * illustration must preserve as its dominant hue.
 *
 * Style: a full flat 2D illustrated landscape (not a single bare icon) —
 * the central element of the theme is embedded in a scene (sky, ground,
 * surroundings, and small details like people, birds, wind, rain, light,
 * sea when it fits the theme). Background is a tinted wash in the theme's
 * color family (white is used only as a light accent), NEVER pure white,
 * so the image reads as the theme's own color.
 *
 * Portrait (1024x1536) is the applied theme; landscape (1536x1024) is the
 * thumbnail used in the picker.
 *
 * Usage:
 *   node scripts/generate-themes.mjs                  # all missing
 *   node scripts/generate-themes.mjs --category villes # only one category
 *   node scripts/generate-themes.mjs --category noel --landscape-only
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv(file) {
  const vars = {};
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return vars;
}

const env = loadEnv(path.join(root, '.env.local'));
const apiKey = process.env.AGNES_API_KEY || env.AGNES_API_KEY;
if (!apiKey) {
  console.error('AGNES_API_KEY manquant (.env.local)');
  process.exit(1);
}

const OUT_DIR = path.join(root, 'public', 'themes');
const API = 'https://apihub.agnes-ai.com/v1/images/generations';

/**
 * One-line scene context appended to each motif (per-theme where set).
 * `people: true` asks for small human silhouettes; `sky: 'rain' | 'storm' |
 * 'stars' | 'snow'` sets the sky condition. The motif itself is the
 * central element of the landscape.
 */
const CATEGORIES = [
  {
    id: 'esprit',
    name: 'Esprit',
    themes: [
      { id: 'esprit-pentecote', name: 'Pentecôte', color: '#C0392B', motif: 'a single descending flame / tongue of fire above a small cluster of heads', people: true, scene: 'a warm interior with small heads seated around it' },
      { id: 'esprit-feu', name: 'Feu du Saint-Esprit', color: '#E74C3C', motif: 'a single flame rising from a small open book', scene: 'on a quiet wooden table in a dim study' },
      { id: 'esprit-zel', name: 'Zèle', color: '#F39C12', motif: 'a single spark with radiating lines', scene: 'over a field of small golden grasses at dusk' },
      { id: 'esprit-olivier', name: 'Rameau d’olivier', color: '#27AE60', motif: 'a single olive branch with leaves', scene: 'held by a small figure standing on a hillside' },
      { id: 'esprit-dove', name: 'Colombe', color: '#3498DB', motif: 'a single dove in flight', scene: 'high above rolling hills and a soft horizon', people: false },
      { id: 'esprit-eau', name: 'Eau vive', color: '#1ABC9C', motif: 'a single water drop with ripple rings', scene: 'falling into a calm shallow spring in a green meadow' },
      { id: 'esprit-semin', name: 'Sémin (vent)', color: '#8E44AD', motif: 'three curved wind lines with a small leaf', scene: 'sweeping across an open valley, tall grass bending in the wind' },
      { id: 'esprit-nouvel', name: 'Vie nouvelle', color: '#2ECC71', motif: 'a single sprout with two leaves', scene: 'pushing through rich dark soil in a freshly watered garden' },
      { id: 'esprit-tete', name: 'Lumière de l’esprit', color: '#F1C40F', motif: 'a single glowing bulb with rays', scene: 'hanging above a small workshop room, two tiny figures looking up' },
      { id: 'esprit-rain', name: 'Pluie d’esprit', color: '#5DADE2', motif: 'three falling drops with small ripples', sky: 'rain', scene: 'gentle rain falling over soft green hills, tiny figures holding small umbrellas' },
    ],
  },
  {
    id: 'evenements',
    name: 'Événements',
    themes: [
      { id: 'ev-pasque', name: 'Pâque', color: '#7D3C98', motif: 'a single lamb silhouette', scene: 'on a small hill among wildflowers, tiny shepherds in the distance' },
      { id: 'ev-noel', name: 'Noël', color: '#1E8449', motif: 'a single Christmas tree with a small star on top', sky: 'snow', scene: 'standing in a snow-covered village square, two small figures beside it' },
      { id: 'ev-epee', name: 'Épiphanie', color: '#F4D03F', motif: 'a single star with rays on small hills', scene: 'rising over gentle hills with three small figures walking toward it' },
      { id: 'ev-temple', name: 'Temple', color: '#B03A2E', motif: 'a single temple with columns and a small roof', scene: 'standing on a raised stone platform, small figures approaching its steps' },
      { id: 'ev-lent', name: 'Carême', color: '#566573', motif: 'a single hourglass', scene: 'resting on a rustic windowsill, muted light falling from the window' },
      { id: 'ev-ascension', name: 'Ascension', color: '#2C3E50', motif: 'a single cloud with a rising arrow', scene: 'above a green landscape at first light, tiny birds alongside' },
      { id: 'ev-toussaint', name: 'Toussaint', color: '#154360', motif: 'a single candle flame', sky: 'stars', scene: 'lit on a stone windowsill overlooking a quiet night landscape' },
      { id: 'ev-resurrection', name: 'Résurrection', color: '#A93226', motif: 'an open empty tomb (stone rolled aside)', scene: 'in a rocky hillside at dawn, three small figures gathered nearby' },
      { id: 'ev-bapteme', name: 'Baptême', color: '#148F77', motif: 'a single water drop over an open scroll', scene: 'in a calm river bend, gentle ripples spreading across the water' },
      { id: 'ev-harvest', name: 'Moisson', color: '#B7950B', motif: 'a single wheat stalk with grains', scene: 'in a vast golden field, two small figures walking between the rows' },
    ],
  },
  {
    id: 'villes',
    name: 'Villes',
    // 10 cities from countries where app-supported languages are spoken.
    // fr → Paris, de → Berlin, ar → Cairo, zh → Beijing, es → Madrid,
    // pt → Lisbon, id → Jakarta, hi → Delhi, tr → Istanbul, ru → St Petersburg.
    // Each landmark sits inside its city's real surroundings (hills, river,
    // desert, skyline…) in the theme's color family.
    themes: [
      { id: 'villes-paris', name: 'Paris', color: '#34495E', motif: 'the Eiffel Tower', scene: 'rising above a softly lit Parisian skyline along the Seine, a few tiny strollers on the quay' },
      { id: 'villes-berlin', name: 'Berlin', color: '#7F8C8D', motif: 'the Brandenburg Gate', scene: 'in a wide open square with old beech trees and thin autumn light' },
      { id: 'villes-caire', name: 'Le Caire', color: '#B7950B', motif: 'a single pyramid with a smaller one behind', scene: 'standing in dunes under a big sun, the Nile a thin ribbon in the distance' },
      { id: 'villes-pekin', name: 'Pékin', color: '#922B21', motif: 'the Great Wall arching over hills', scene: 'winding along mountain ridges with mist drifting between the peaks' },
      { id: 'villes-madrid', name: 'Madrid', color: '#CA6F1E', motif: 'a single bull', scene: 'on an open plain at golden hour, a small ring of figures watching' },
      { id: 'villes-lisbonne', name: 'Lisbonne', color: '#1F618D', motif: 'a single bridge over wavy water', scene: 'spanning the river estuary, small hills and houses on the far bank' },
      { id: 'villes-jakarta', name: 'Jakarta', color: '#148F77', motif: 'a single mosque with a crescent dome', scene: 'among coconut palms over a wide lagoon, a small boat drifting by' },
      { id: 'villes-delhi', name: 'Delhi', color: '#B03A2E', motif: 'the Lotus Temple', scene: 'in a green park with lotus ponds, tiny visitors walking on paths' },
      { id: 'villes-istanbul', name: 'Istanbul', color: '#5B2C6F', motif: 'the Blue Mosque with minarets', scene: 'beside the Bosphorus, small fishing boats on the water at dusk' },
      { id: 'villes-stpetersbourg', name: 'St Pétersbourg', color: '#1A5276', motif: 'a single church with an onion dome and cross', scene: 'above a wide river embankment, thin winter light, a few small figures on the frozen bank' },
    ],
  },
  {
    id: 'natures',
    name: 'Nature',
    themes: [
      { id: 'nat-trees', name: 'Forêt', color: '#1E8449', motif: 'three pine trees of varying heights', scene: 'in a misty pine valley, soft light through the canopy' },
      { id: 'nat-mont', name: 'Montagnes', color: '#4A235A', motif: 'a single mountain peak with a small snow cap', scene: 'over a river valley below, a tiny flock of birds crossing the sky' },
      { id: 'nat-cactus', name: 'Désert', color: '#CA6F1E', motif: 'a single cactus with a small sun', scene: 'in rippled dunes at sunset, a small camel walking in the far distance' },
      { id: 'nat-fleurs', name: 'Fleurs', color: '#C2185B', motif: 'three flowers with stems and leaves', scene: 'in a small flower field, two tiny bees drifting between them' },
      { id: 'nat-feuille', name: 'Feuillage', color: '#27AE60', motif: 'a single large leaf with veins', scene: 'resting on calm water, ripples spreading around it, reeds on the bank' },
      { id: 'nat-paon', name: 'Oiseau', color: '#1565C0', motif: 'a single bird perched on a branch', scene: 'at the edge of a lake at first light, reeds and a few distant birds' },
      { id: 'nat-lune', name: 'Lune', color: '#1B4F72', motif: 'a crescent moon with three small stars', sky: 'stars', scene: 'over a quiet sleeping landscape, a thin river of light on the ground' },
      { id: 'nat-sun', name: 'Soleil', color: '#F39C12', motif: 'a single sun with rays above a small hill', scene: 'rising over a green hill, a tiny shepherd and his flock on the crest' },
      { id: 'nat-ocean', name: 'Océan', color: '#0E6655', motif: 'three wavy lines and a small anchor', scene: 'a calm open sea, a small sailboat and distant birds on the horizon' },
      { id: 'nat-pluie', name: 'Pluie', color: '#21618C', motif: 'a single cloud with three drops', sky: 'rain', scene: 'steady rain over a small field, ripples on a shallow pond, two tiny figures with umbrellas' },
    ],
  },
  {
    id: 'sagesse',
    name: 'Sagesse',
    themes: [
      { id: 'sag-livre', name: 'Livre', color: '#6E2C00', motif: 'an open book with two pages', scene: 'on a wooden reading table by a round window, warm light falling across the pages' },
      { id: 'sag-plume', name: 'Plume', color: '#283747', motif: 'a single feather quill', scene: 'resting in a small inkwell on a scholar’s desk, papers softly spread around it' },
      { id: 'sag-lam', name: 'Lamplume', color: '#B9770E', motif: 'a single oil lamp with a flame', sky: 'stars', scene: 'on a stone wall overlooking a quiet night village, its light a small pool in the dark' },
      { id: 'sag-perle', name: 'Perle', color: '#A569BD', motif: 'a single pearl in an open shell', scene: 'on a smooth pebble beach, thin waves lapping at its edge' },
      { id: 'sag-miroir', name: 'Miroir', color: '#566573', motif: 'a round mirror on a stand', scene: 'in a hushed hall, reflecting a thin window of light' },
      { id: 'sag-tri', name: 'Triangle', color: '#1F618D', motif: 'a single equilateral triangle with inner lines', scene: 'etched on a wide slab of stone, small grasses growing around its edges' },
      { id: 'sag-horloger', name: 'Boussole', color: '#117864', motif: 'a single compass rose', scene: 'carved on the deck of a small boat, calm water around it' },
      { id: 'sag-geometrie', name: 'Geométrie', color: '#4A235A', motif: 'overlapping circles and squares', scene: 'drawn in chalk on a flat rooftop at dusk, the city small below' },
      { id: 'sag-colonne', name: 'Colonne', color: '#7B241C', motif: 'a single classical column', scene: 'standing on an open plaza, two small figures walking past for scale' },
      { id: 'sag-sceau', name: 'Sceau', color: '#B03A2E', motif: 'a single wax seal with a ribbon', scene: 'on a parchment letter lying on a desk, candlelight from one side' },
    ],
  },
  {
    id: 'fraternite',
    name: 'Fraternité',
    themes: [
      { id: 'frat-pains', name: 'Pain partagé', color: '#B9770E', motif: 'two loaves of bread on a plate', people: true, scene: 'on a long rustic table, several small figures seated together' },
      { id: 'frat-table', name: 'Table commune', color: '#6E2C00', motif: 'a single round table with a cup and plate', people: true, scene: 'in an open courtyard, small figures gathered around it' },
      { id: 'frat-mains', name: 'Mains jointes', color: '#A04000', motif: 'two hands clasped together', scene: 'seen from above, two small figures standing face to face on a path' },
      { id: 'frat-cord', name: 'Cordes liées', color: '#1F618D', motif: 'two interlocking rings', scene: 'hanging from a rope line over a quiet harbor, small boats below' },
      { id: 'frat-grenade', name: 'Cèdre', color: '#1E8449', motif: 'a single cedar tree', scene: 'on a high ridge over the sea, a few birds circling its crown' },
      { id: 'frat-lantern', name: 'Lanterne', color: '#B9770E', motif: 'a single lantern with a flame', sky: 'stars', scene: 'carried by a small figure on a narrow night road, stars above' },
      { id: 'frat-rainbow', name: 'Arc-en-ciel', color: '#C2185B', motif: 'three curved arcs over a small house', scene: 'after rain, a small garden and a child standing in the yard looking up' },
      { id: 'frat-tour', name: 'Tour', color: '#283747', motif: 'a single tower with a small flag', scene: 'rising over small rooftops, a thin chimney smoke drifting by' },
      { id: 'frat-oiseaux', name: 'Oiseaux', color: '#1565C0', motif: 'three birds in flight', scene: 'over a wide river valley at dusk, a small boat on the water below' },
      { id: 'frat-couron', name: 'Couronne', color: '#B03A2E', motif: 'a single crown', scene: 'on a velvet cushion by a tall window, soft evening light' },
    ],
  },
  {
    id: 'lumieres',
    name: 'Lumières',
    themes: [
      { id: 'lum-etoile', name: 'Étoile', color: '#F1C40F', motif: 'a five-pointed star', sky: 'stars', scene: 'guiding a small caravan across sand, its light leading the way' },
      { id: 'lum-lanter', name: 'Lanterne', color: '#E67E22', motif: 'a single lantern hanging from a hook', sky: 'stars', scene: 'in a dark village alley, its glow catching the wet cobblestones' },
      { id: 'lum-chand', name: 'Chandelle', color: '#F9E79F', motif: 'a single lit candle', scene: 'on a small table by an open window, night air moving the curtain' },
      { id: 'lum-bougie', name: 'Bougie', color: '#F4D03F', motif: 'a small candle in a holder', scene: 'on a stone bridge railing over a river, its reflection shimmering below' },
      { id: 'lum-lune', name: 'Lune', color: '#1B4F72', motif: 'a crescent moon', sky: 'stars', scene: 'over a sleeping sea, its reflection a broken path of light on the water' },
      { id: 'lum-sunrise', name: 'Lever de soleil', color: '#CA6F1E', motif: 'a half sun over wavy water', scene: 'the sun lifting over a calm sea, a small boat drifting on the gold' },
      { id: 'lum-lamp', name: 'Lampe', color: '#B9770E', motif: 'a single table lamp', scene: 'on a desk in a small warm room, a cat curled asleep beside it' },
      { id: 'lum-feu', name: 'Feu de camp', color: '#E74C3C', motif: 'a single flame over three logs', sky: 'stars', scene: 'around a campfire on a hillside, two small figures and a dog resting near it' },
      { id: 'lum-phares', name: 'Phare', color: '#1565C0', motif: 'a single lighthouse with a light beam', scene: 'on a rocky headland in rough weather, its beam cutting across the waves' },
      { id: 'lum-diamant', name: 'Diamant', color: '#A569BD', motif: 'a single cut gemstone', scene: 'resting on dark stone, a thin beam of light splitting into small colored rays' },
    ],
  },
  {
    id: 'saisons',
    name: 'Saisons',
    themes: [
      { id: 'sai-printemps', name: 'Printemps', color: '#27AE60', motif: 'a single cherry blossom branch', scene: 'over a gentle stream, petals drifting into the water' },
      { id: 'sai-ete', name: 'Été', color: '#F39C12', motif: 'a single sun with a leaf', scene: 'over a green field at high noon, two small figures resting in the shade of a tree' },
      { id: 'sai-autome', name: 'Automne', color: '#CA6F1E', motif: 'three falling leaves', scene: 'in an empty park path, wind pushing a small figure’s coat' },
      { id: 'sai-hiver', name: 'Hiver', color: '#21618C', motif: 'a single snowflake', sky: 'snow', scene: 'falling over a frozen pond, a thin trail of footprints across the ice' },
      { id: 'sai-neige', name: 'Neige', color: '#1B4F72', motif: 'three snowflakes of varying size', sky: 'snow', scene: 'landing on a quiet rooftop, a small figure sweeping the walkway' },
      { id: 'sai-rain', name: 'Pluie', color: '#566573', motif: 'a single cloud with drops', sky: 'rain', scene: 'steady rain over a small wooden bridge, a figure with an umbrella crossing it' },
      { id: 'sai-fleur', name: 'Fleur', color: '#C2185B', motif: 'a single flower with petals', scene: 'growing from a thin crack in old stone wall, vines above it' },
      { id: 'sai-feuille', name: 'Feuille', color: '#1E8449', motif: 'a single maple leaf', scene: 'resting on a wet cobblestone street, faint reflections of old houses' },
      { id: 'sai-nuit', name: 'Nuit', color: '#154360', motif: 'a crescent moon with three stars', sky: 'stars', scene: 'over sleeping fields, a thin river of moonlight on the ground' },
      { id: 'sai-dawn', name: 'Aube', color: '#F4D03F', motif: 'a half sun over hills with rays', scene: 'first light lifting over layered hills, a small figure standing on the highest one' },
    ],
  },
  {
    id: 'animaux',
    name: 'Animaux',
    themes: [
      { id: 'ani-belle', name: 'Gazelle', color: '#B9770E', motif: 'a single gazelle', scene: 'leaping in a dry grassland, distant small figures watching from a ridge' },
      { id: 'ani-agneau', name: 'Agneau', color: '#6E2C00', motif: 'a single lamb', scene: 'in a soft pasture at dawn, its mother standing behind it' },
      { id: 'ani-pigeon', name: 'Pigeon', color: '#283747', motif: 'a single pigeon in flight', scene: 'over a stone plaza, two more pigeons settling on a ledge below' },
      { id: 'ani-abeille', name: 'Abeille', color: '#F39C12', motif: 'a single bee over a flower', scene: 'in a bright meadow of small blooms, a second bee trailing behind it' },
      { id: 'ani-colombe', name: 'Colombe', color: '#1565C0', motif: 'a single dove holding an olive branch', scene: 'flying over a calm lake, its reflection a soft blur on the water' },
      { id: 'ani-taupe', name: 'Taupe', color: '#6E2C00', motif: 'a single mole', scene: 'emerging from a small mound in a garden bed, roots and worms nearby' },
      { id: 'ani-cam', name: 'Chameau', color: '#CA6F1E', motif: 'a single camel', scene: 'walking a dune crest with two more in a line behind it, wind in the sand' },
      { id: 'ani-pharaon', name: 'Pharaon', color: '#B03A2E', motif: 'a single ankh symbol', scene: 'carved on a wide stone wall, small figures walking past below it' },
      { id: 'ani-scorp', name: 'Scorpion', color: '#4A235A', motif: 'a single scorpion', scene: 'on smooth desert rock under a large sun, its shadow long behind it' },
      { id: 'ani-aigle', name: 'Aigle', color: '#283747', motif: 'a single eagle with spread wings', scene: 'soaring above a mountain pass, circling once in the thin air' },
    ],
  },
  {
    id: 'objets',
    name: 'Objets',
    themes: [
      { id: 'obj-clé', name: 'Clé', color: '#B9770E', motif: 'a single antique key', scene: 'hanging on a thick rope tied to an old wooden door, a small window of light behind it' },
      { id: 'obj-cle', name: 'Clef', color: '#6E2C00', motif: 'a small key with a bow', scene: 'lying on worn wooden floorboards, dust in a single beam of light' },
      { id: 'obj-sceau', name: 'Sceau', color: '#B03A2E', motif: 'a single wax seal', scene: 'pressing onto a letter on a desk, a candle guttering nearby' },
      { id: 'obj-vase', name: 'Vase', color: '#1F618D', motif: 'a single amphora vase', scene: 'on a low shelf in a stone room, small plants spilling over the edge' },
      { id: 'obj-jar', name: 'Jarre', color: '#CA6F1E', motif: 'a single clay jar', scene: 'in a sunlit market stall, two small figures browsing nearby' },
      { id: 'obj-ankh', name: 'Ankh', color: '#B03A2E', motif: 'a single ankh cross', scene: 'held aloft by a small figure on a riverbank at sunset' },
      { id: 'obj-swan', name: 'Cygne', color: '#283747', motif: 'a single swan on water', scene: 'gliding on a mirror-still lake, reeds and a thin sunset band behind it' },
      { id: 'obj-anchor', name: 'Ancre', color: '#1565C0', motif: 'a single anchor', scene: 'swinging from the deck of a small boat, its reflection in the green water below' },
      { id: 'obj-veil', name: 'Voile', color: '#A569BD', motif: 'a single veil draping over a face', scene: 'a lone small figure standing in an open doorway, wind lifting the veil' },
      { id: 'obj-donnee', name: 'Don', color: '#C2185B', motif: 'a single gift box with a ribbon', scene: 'on small grassy steps, two tiny figures kneeling to open it together' },
    ],
  },
];

// ---------------------------------------------------------------------------
// CLI filters
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const catIdx = argv.indexOf('--category');
const catFilter = catIdx !== -1 ? argv[catIdx + 1] : null;
const landscapeOnly = argv.includes('--landscape-only');
const portraitOnly = argv.includes('--portrait-only');
// Regenerate the existing files for the selected scope (default: keep
// files that already exist — resume behavior).
const regenerate = argv.includes('--regenerate');

const sizes = {
  portrait: '1024x1536',   // applied theme (full screen)
  landscape: '1536x1024',  // thumbnail for picker
};

// Build the full task list (flattened).
const tasks = [];
for (const cat of CATEGORIES) {
  if (catFilter && cat.id !== catFilter) continue;
  for (const th of cat.themes) {
    const orientations = [];
    if (!landscapeOnly) orientations.push('portrait');
    if (!portraitOnly) orientations.push('landscape');
    for (const orient of orientations) {
      tasks.push({ cat, th, orient });
    }
  }
}
console.log(`Tasks: ${tasks.length}${regenerate ? ' (regenerate all in scope)' : ''}`);
if (tasks.length === 0) {
  console.log('Nothing to do. Available categories:',
    CATEGORIES.map(c => c.id).join(', '));
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------
function outPath(cat, th, orient) {
  return path.join(OUT_DIR, cat.id, `${th.id}-${orient}.png`);
}

/**
 * The new prompt: a full illustrated landscape (not a bare icon) in the
 * theme's color family, with the central element from the theme + a
 * scene context + a few small details (people, birds, wind, rain, light,
 * sea…). White is explicitly demoted to an accent; the background is a
 * tinted wash in the theme's hue so the image keeps the theme color.
 */
function promptFor(th, orient) {
  const scene = th.scene ? ` ${th.scene},` : '';
  const sky = th.sky ? ` sky with ${th.sky} sky conditions,` : '';
  const people = th.people === undefined ? 'a couple of very small human silhouettes for scale,' : th.people ? 'small human figures as secondary details,' : 'no human figures,';
  const base = [
    `flat 2D minimalist landscape illustration, NO 3D, NO volume, NO realistic rendering,`,
    `full picture: the central element of the theme is ${th.motif}, embedded in a scene:`,
    `${th.scene ?? 'a calm open landscape with soft ground and sky'}.`,
    sky,
    `details: ${people} plus small ambient details that fit the theme (birds, wind, rain, waves, light rays… where appropriate).`,
    `color: keep ${th.color} as the dominant theme color throughout the whole image —`,
    `the sky, ground and every element are tints, shades and soft complementary tones of that color;`,
    `white is used ONLY as a very light accent (highlights, stars, mist), never as the background.`,
    `background: a tinted wash in the theme's color family (dark-to-light gradient), absolutely no pure white background.`,
    orient === 'landscape'
      ? `landscape 1536x1024 composition, the central element placed with generous margins`
      : `portrait 1024x1536 composition, the central element in the upper two-thirds with room for the ground below`,
  ].filter(Boolean);
  return base.join(' ');
}

async function generateOne(task, retries = 3) {
  const { cat, th, orient } = task;
  const out = outPath(cat, th, orient);
  if (existsSync(out) && !regenerate) {
    console.log(`SKIP ${cat.id}/${th.id}-${orient} (exists)`);
    return { id: `${th.id}-${orient}`, skipped: true };
  }
  if (existsSync(out)) unlinkSync(out);
  mkdirSync(path.dirname(out), { recursive: true });
  const body = {
    model: 'agnes-image-2.5-flash',
    prompt: promptFor(th, orient),
    n: 1,
    size: sizes[orient],
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Agnes API ${res.status}: ${err.slice(0, 300)}`);
      }
      const data = await res.json();
      const item = data.data?.[0];
      let buf;
      if (item?.url) {
        buf = Buffer.from(await (await fetch(item.url)).arrayBuffer());
      } else if (item?.b64_json) {
        buf = Buffer.from(item.b64_json, 'base64');
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(data).slice(0, 300)}`);
      }
      writeFileSync(out, buf);
      console.log(`OK   ${cat.id}/${th.id}-${orient} → ${out}`);
      return { id: `${th.id}-${orient}`, ok: true, bytes: buf.length };
    } catch (e) {
      console.warn(`FAIL ${cat.id}/${th.id}-${orient} (attempt ${attempt}/${retries}) ${e.message}`);
      if (attempt === retries) return { id: `${th.id}-${orient}`, failed: true, error: e.message };
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

// Run tasks sequentially (Agnes API is not parallel-safe).
const results = [];
for (const task of tasks) {
  results.push(await generateOne(task));
}
const ok = results.filter((r) => r.ok).length;
const skip = results.filter((r) => r.skipped).length;
const fail = results.filter((r) => r.failed).length;
console.log(`\nDone: ${ok} generated, ${skip} skipped (already present), ${fail} failed.`);
if (fail > 0) {
  console.log('Failed:', results.filter((r) => r.failed).map((r) => r.id).join(', '));
}
