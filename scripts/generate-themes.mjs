#!/usr/bin/env node
/**
 * Agnes image batch generator — 200 theme images (100 portrait + 100 landscape).
 *
 * 10 categories × 10 themes each. Each theme = 1 core color, no shape in 3D,
 * flat 2D minimal illustration, white background. Portrait (1024x1536) is the
 * applied theme; landscape (1536x1024) is the thumbnail used in the picker.
 *
 * Usage:
 *   node scripts/generate-themes.mjs            # all remaining
 *   node scripts/generate-themes.mjs --category villes  # only one category
 *   node scripts/generate-themes.mjs --category noel --landscape-only
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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
 * The 100 themes.
 * Each: { id, category, name, color (hex), motif (English description of the
 * single-color flat-2D illustration).
 *
 * Languages supported by the app: fr, en, ar, de, zh, es, pt, id, ms, vi,
 * hi, sw, ta, te, th, tr, ru, ja, ko, he, nl, pl, it, fa, bn, ur, am, ne,
 * ha, yo, ku, ps, sd, ml, si, km, lo, my, zh-Hant, fil, ig, tw, so, dz, st.
 * Cities are picked from countries where these languages are spoken.
 */
const CATEGORIES = [
  {
    id: 'esprit',
    name: 'Esprit',
    themes: [
      { id: 'esprit-pentecote', name: 'Pentecôte', color: '#C0392B', motif: 'a single descending flame / tongue of fire above a small cluster of heads' },
      { id: 'esprit-feu', name: 'Feu du Saint-Esprit', color: '#E74C3C', motif: 'a single flame rising from a small open book' },
      { id: 'esprit-zel', name: 'Zèle', color: '#F39C12', motif: 'a single spark with radiating lines' },
      { id: 'esprit-olivier', name: 'Rameau d’olivier', color: '#27AE60', motif: 'a single olive branch with leaves' },
      { id: 'esprit-dove', name: 'Colombe', color: '#3498DB', motif: 'a single dove in flight' },
      { id: 'esprit-eau', name: 'Eau vive', color: '#1ABC9C', motif: 'a single water drop with ripple rings' },
      { id: 'esprit-semin', name: 'Sémin (vent)', color: '#8E44AD', motif: 'three curved wind lines with a small leaf' },
      { id: 'esprit-nouvel', name: 'Vie nouvelle', color: '#2ECC71', motif: 'a single sprout with two leaves' },
      { id: 'esprit-tete', name: 'Lumière de l’esprit', color: '#F1C40F', motif: 'a single glowing bulb with rays' },
      { id: 'esprit-rain', name: 'Pluie d’esprit', color: '#5DADE2', motif: 'three falling drops with small ripples' },
    ],
  },
  {
    id: 'evenements',
    name: 'Événements',
    themes: [
      { id: 'ev-pasque', name: 'Pâque', color: '#7D3C98', motif: 'a single lamb silhouette' },
      { id: 'ev-noel', name: 'Noël', color: '#1E8449', motif: 'a single Christmas tree with a small star on top' },
      { id: 'ev-epee', name: 'Épiphanie', color: '#F4D03F', motif: 'a single star with rays on small hills' },
      { id: 'ev-temple', name: 'Temple', color: '#B03A2E', motif: 'a single temple with columns and a small roof' },
      { id: 'ev-lent', name: 'Carême', color: '#566573', motif: 'a single hourglass' },
      { id: 'ev-ascension', name: 'Ascension', color: '#2C3E50', motif: 'a single cloud with a rising arrow' },
      { id: 'ev-toussaint', name: 'Toussaint', color: '#154360', motif: 'a single candle flame' },
      { id: 'ev-resurrection', name: 'Résurrection', color: '#A93226', motif: 'an open empty tomb (stone rolled aside)' },
      { id: 'ev-bapteme', name: 'Baptême', color: '#148F77', motif: 'a single water drop over an open scroll' },
      { id: 'ev-harvest', name: 'Moisson', color: '#B7950B', motif: 'a single wheat stalk with grains' },
    ],
  },
  {
    id: 'villes',
    name: 'Villes',
    // 10 cities from countries where app-supported languages are spoken.
    // fr → Paris, de → Berlin, ar → Cairo, zh → Beijing, es → Madrid,
    // pt → Lisbon, id → Jakarta, hi → Delhi, tr → Istanbul, ru → St Petersburg.
    themes: [
      { id: 'villes-paris', name: 'Paris', color: '#34495E', motif: 'the Eiffel Tower, flat 2D single silhouette' },
      { id: 'villes-berlin', name: 'Berlin', color: '#7F8C8D', motif: 'the Brandenburg Gate, flat 2D single silhouette' },
      { id: 'villes-caire', name: 'Le Caire', color: '#B7950B', motif: 'a single pyramid with a smaller one behind' },
      { id: 'villes-pekin', name: 'Pékin', color: '#922B21', motif: 'the Great Wall arching over hills' },
      { id: 'villes-madrid', name: 'Madrid', color: '#CA6F1E', motif: 'a single bull silhouette' },
      { id: 'villes-lisbonne', name: 'Lisbonne', color: '#1F618D', motif: 'a single bridge over wavy water' },
      { id: 'villes-jakarta', name: 'Jakarta', color: '#148F77', motif: 'a single mosque with a crescent dome' },
      { id: 'villes-delhi', name: 'Delhi', color: '#B03A2E', motif: 'the Lotus Temple, flat 2D single silhouette' },
      { id: 'villes-istanbul', name: 'Istanbul', color: '#5B2C6F', motif: 'the Blue Mosque with minarets, flat 2D single silhouette' },
      { id: 'villes-stpetersbourg', name: 'St Pétersbourg', color: '#1A5276', motif: 'a single church with an onion dome and cross' },
    ],
  },
  {
    id: 'natures',
    name: 'Nature',
    themes: [
      { id: 'nat-trees', name: 'Forêt', color: '#1E8449', motif: 'three pine trees of varying heights' },
      { id: 'nat-mont', name: 'Montagnes', color: '#4A235A', motif: 'a single mountain peak with a small snow cap' },
      { id: 'nat-cactus', name: 'Désert', color: '#CA6F1E', motif: 'a single cactus with a small sun' },
      { id: 'nat-fleurs', name: 'Fleurs', color: '#C2185B', motif: 'three flowers with stems and leaves' },
      { id: 'nat-feuille', name: 'Feuillage', color: '#27AE60', motif: 'a single large leaf with veins' },
      { id: 'nat-paon', name: 'Oiseau', color: '#1565C0', motif: 'a single bird perched on a branch' },
      { id: 'nat-lune', name: 'Lune', color: '#1B4F72', motif: 'a crescent moon with three small stars' },
      { id: 'nat-sun', name: 'Soleil', color: '#F39C12', motif: 'a single sun with rays above a small hill' },
      { id: 'nat-ocean', name: 'Océan', color: '#0E6655', motif: 'three wavy lines and a small anchor' },
      { id: 'nat-pluie', name: 'Pluie', color: '#21618C', motif: 'a single cloud with three drops' },
    ],
  },
  {
    id: 'sagesse',
    name: 'Sagesse',
    themes: [
      { id: 'sag-livre', name: 'Livre', color: '#6E2C00', motif: 'an open book with two pages' },
      { id: 'sag-plume', name: 'Plume', color: '#283747', motif: 'a single feather quill' },
      { id: 'sag-lam', name: 'Lamplume', color: '#B9770E', motif: 'a single oil lamp with a flame' },
      { id: 'sag-perle', name: 'Perle', color: '#A569BD', motif: 'a single pearl in an open shell' },
      { id: 'sag-miroir', name: 'Miroir', color: '#566573', motif: 'a round mirror on a stand' },
      { id: 'sag-tri', name: 'Triangle', color: '#1F618D', motif: 'a single equilateral triangle with inner lines' },
      { id: 'sag-horloger', name: 'Boussole', color: '#117864', motif: 'a single compass rose' },
      { id: 'sag-geometrie', name: 'Geométrie', color: '#4A235A', motif: 'overlapping circles and squares' },
      { id: 'sag-colonne', name: 'Colonne', color: '#7B241C', motif: 'a single classical column' },
      { id: 'sag-sceau', name: 'Sceau', color: '#B03A2E', motif: 'a single wax seal with a ribbon' },
    ],
  },
  {
    id: 'fraternite',
    name: 'Fraternité',
    themes: [
      { id: 'frat-pains', name: 'Pain partagé', color: '#B9770E', motif: 'two loaves of bread on a plate' },
      { id: 'frat-table', name: 'Table commune', color: '#6E2C00', motif: 'a single round table with a cup and plate' },
      { id: 'frat-mains', name: 'Mains jointes', color: '#A04000', motif: 'two hands clasped together' },
      { id: 'frat-cord', name: 'Cordes liées', color: '#1F618D', motif: 'two interlocking rings' },
      { id: 'frat-grenade', name: 'Cèdre', color: '#1E8449', motif: 'a single cedar tree' },
      { id: 'frat-lantern', name: 'Lanterne', color: '#B9770E', motif: 'a single lantern with a flame' },
      { id: 'frat-rainbow', name: 'Arc-en-ciel', color: '#C2185B', motif: 'three curved arcs over a small house' },
      { id: 'frat-tour', name: 'Tour', color: '#283747', motif: 'a single tower with a small flag' },
      { id: 'frat-oiseaux', name: 'Oiseaux', color: '#1565C0', motif: 'three birds in flight' },
      { id: 'frat-couron', name: 'Couronne', color: '#B03A2E', motif: 'a single crown' },
    ],
  },
  {
    id: 'lumieres',
    name: 'Lumières',
    themes: [
      { id: 'lum-etoile', name: 'Étoile', color: '#F1C40F', motif: 'a five-pointed star' },
      { id: 'lum-lanter', name: 'Lanterne', color: '#E67E22', motif: 'a single lantern hanging from a hook' },
      { id: 'lum-chand', name: 'Chandelle', color: '#F9E79F', motif: 'a single lit candle' },
      { id: 'lum-bougie', name: 'Bougie', color: '#F4D03F', motif: 'a small candle in a holder' },
      { id: 'lum-lune', name: 'Lune', color: '#1B4F72', motif: 'a crescent moon' },
      { id: 'lum-sunrise', name: 'Lever de soleil', color: '#CA6F1E', motif: 'a half sun over wavy water' },
      { id: 'lum-lamp', name: 'Lampe', color: '#B9770E', motif: 'a single table lamp' },
      { id: 'lum-feu', name: 'Feu de camp', color: '#E74C3C', motif: 'a single flame over three logs' },
      { id: 'lum-phares', name: 'Phare', color: '#1565C0', motif: 'a single lighthouse with a light beam' },
      { id: 'lum-diamant', name: 'Diamant', color: '#A569BD', motif: 'a single cut gemstone' },
    ],
  },
  {
    id: 'saisons',
    name: 'Saisons',
    themes: [
      { id: 'sai-printemps', name: 'Printemps', color: '#27AE60', motif: 'a single cherry blossom branch' },
      { id: 'sai-ete', name: 'Été', color: '#F39C12', motif: 'a single sun with a leaf' },
      { id: 'sai-autome', name: 'Automne', color: '#CA6F1E', motif: 'three falling leaves' },
      { id: 'sai-hiver', name: 'Hiver', color: '#21618C', motif: 'a single snowflake' },
      { id: 'sai-neige', name: 'Neige', color: '#1B4F72', motif: 'three snowflakes of varying size' },
      { id: 'sai-rain', name: 'Pluie', color: '#566573', motif: 'a single cloud with drops' },
      { id: 'sai-fleur', name: 'Fleur', color: '#C2185B', motif: 'a single flower with petals' },
      { id: 'sai-feuille', name: 'Feuille', color: '#1E8449', motif: 'a single maple leaf' },
      { id: 'sai-nuit', name: 'Nuit', color: '#154360', motif: 'a crescent moon with three stars' },
      { id: 'sai-dawn', name: 'Aube', color: '#F4D03F', motif: 'a half sun over hills with rays' },
    ],
  },
  {
    id: 'animaux',
    name: 'Animaux',
    themes: [
      { id: 'ani-belle', name: 'Gazelle', color: '#B9770E', motif: 'a single gazelle silhouette' },
      { id: 'ani-agneau', name: 'Agneau', color: '#6E2C00', motif: 'a single lamb' },
      { id: 'ani-pigeon', name: 'Pigeon', color: '#283747', motif: 'a single pigeon in flight' },
      { id: 'ani-abeille', name: 'Abeille', color: '#F39C12', motif: 'a single bee over a flower' },
      { id: 'ani-colombe', name: 'Colombe', color: '#1565C0', motif: 'a single dove holding an olive branch' },
      { id: 'ani-taupe', name: 'Taupe', color: '#6E2C00', motif: 'a single mole' },
      { id: 'ani-cam', name: 'Chameau', color: '#CA6F1E', motif: 'a single camel' },
      { id: 'ani-pharaon', name: 'Pharaon', color: '#B03A2E', motif: 'a single ankh symbol' },
      { id: 'ani-scorp', name: 'Scorpion', color: '#4A235A', motif: 'a single scorpion' },
      { id: 'ani-aigle', name: 'Aigle', color: '#283747', motif: 'a single eagle with spread wings' },
    ],
  },
  {
    id: 'objets',
    name: 'Objets',
    themes: [
      { id: 'obj-clé', name: 'Clé', color: '#B9770E', motif: 'a single antique key' },
      { id: 'obj-cle', name: 'Clef', color: '#6E2C00', motif: 'a small key with a bow' },
      { id: 'obj-sceau', name: 'Sceau', color: '#B03A2E', motif: 'a single wax seal' },
      { id: 'obj-vase', name: 'Vase', color: '#1F618D', motif: 'a single amphora vase' },
      { id: 'obj-jar', name: 'Jarre', color: '#CA6F1E', motif: 'a single clay jar' },
      { id: 'obj-ankh', name: 'Ankh', color: '#B03A2E', motif: 'a single ankh cross' },
      { id: 'obj-swan', name: 'Cygne', color: '#283747', motif: 'a single swan on water' },
      { id: 'obj-anchor', name: 'Ancre', color: '#1565C0', motif: 'a single anchor' },
      { id: 'obj-veil', name: 'Voile', color: '#A569BD', motif: 'a single veil draping over a face' },
      { id: 'obj-donnee', name: 'Don', color: '#C2185B', motif: 'a single gift box with a ribbon' },
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
console.log(`Tasks: ${tasks.length}`);
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

function promptFor(th, orient) {
  return [
    `flat 2D minimalist illustration, NO 3D, NO shapes with volume,`,
    `single color ${th.color} on a clean pure white (#FFFFFF) background,`,
    `the illustration of ${th.motif},`,
    orient === 'landscape'
      ? `landscape 1536x1024, the motif centered with generous margins around it`
      : `portrait 1024x1536, the motif centered with generous margins around it`,
  ].join(' ');
}

async function generateOne(task, retries = 3) {
  const { cat, th, orient } = task;
  const out = outPath(cat, th, orient);
  if (existsSync(out)) {
    console.log(`SKIP ${cat.id}/${th.id}-${orient} (exists)`);
    return { id: `${th.id}-${orient}`, skipped: true };
  }
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
