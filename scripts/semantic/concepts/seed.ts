/**
 * Stage C — seed concept vocabulary.
 *
 * The canonical 50-concept seed, exported as `SeedConceptDef[]`. Used when
 * the NEUU topic layers are absent (as on this box — `importAllLayers`
 * falls back to this documented list). Each concept carries the
 * schema-shape fields (snake_case, per spec) plus the pipeline join keys
 * Stages A–H need:
 *
 *   id                    — detUuid(`seed-concept:seed:<key>`), byte-stable
 *   canonical_name        — default-language (en) label
 *   slug                  — casefold + de-accented key token
 *   labels_by_language    — en / fr / pt labels (i18n-agnostic data)
 *   description           — one-line, translation-independent
 *   source_provenance     — 'derived' (curated fixed list; no dataset claim)
 *   confidence            — 1.0 (authoritative curated seed)
 *   status                — 'accepted'
 *   key                   — `seed:<key>` (pipeline join token)
 *   head_verse            — canonical verse key `bookId:c:v`
 *   kind                  — TOPIC / PERSON / EVENT / TEACHING / OTHER
 */

import { detUuid, casefold, stripDiacritics } from '../helpers';

export interface SeedConceptDef {
  id: string;
  /** snake_case fields mirror the schema columns (spec-mandated shape). */
  canonical_name: string;
  slug: string;
  labels_by_language: Record<string, string>;
  description: string;
  source_provenance: string;
  confidence: number;
  status: 'unresolved' | 'accepted';
  /** Pipeline key `seed:<key>` (join token for Stages A–H). */
  key: string;
  /** Head verse — canonical key `bookId:chapter:verse` (Stage E attaches PRIMARY). */
  head_verse: string;
  kind: 'TOPIC' | 'PERSON' | 'EVENT' | 'TEACHING' | 'OTHER';
}

type DefKind = SeedConceptDef['kind'];
type DefLabels = Record<'en' | 'fr' | 'pt', string>;

interface SeedDef {
  /** Pipeline-key token; the key becomes `seed:<key>`. */
  key: string;
  name: string;
  labels: DefLabels;
  desc: string;
  head: string;
  kind: DefKind;
}

const DEFS: SeedDef[] = [
  // — 16 core virtues / topics
  { key: 'humility', name: 'Humility', labels: { en: 'Humility', fr: 'Humilité', pt: 'Humildade' }, desc: 'Lowliness of spirit; the opposite of pride.', head: 'jac:4:10', kind: 'TOPIC' },
  { key: 'pride', name: 'Pride', labels: { en: 'Pride', fr: 'Orgueil', pt: 'Soberba' }, desc: 'Self-exaltation; the root sin that precedes the fall.', head: 'prov:16:18', kind: 'TOPIC' },
  { key: 'faith', name: 'Faith', labels: { en: 'Faith', fr: 'Foi', pt: 'Fé' }, desc: 'Trust in God and his promises, the substance of things hoped for.', head: 'heb:11:1', kind: 'TOPIC' },
  { key: 'love', name: 'Love', labels: { en: 'Love', fr: 'Amour', pt: 'Amor' }, desc: 'Unconditional, self-giving love of God and neighbor.', head: 'mat:22:37', kind: 'TOPIC' },
  { key: 'grace', name: 'Grace', labels: { en: 'Grace', fr: 'Grâce', pt: 'Graça' }, desc: 'Unmerited favor of God toward sinners.', head: 'eph:2:8', kind: 'TOPIC' },
  { key: 'forgiveness', name: 'Forgiveness', labels: { en: 'Forgiveness', fr: 'Pardon', pt: 'Perdão' }, desc: 'The release of one party from the debt or obligation caused by wrong.', head: 'mat:6:14', kind: 'TOPIC' },
  { key: 'obedience', name: 'Obedience', labels: { en: 'Obedience', fr: 'Obéissance', pt: 'Obediência' }, desc: "Willing submission to the authority of God, Christ, or one another.", head: 'rom:1:5', kind: 'TOPIC' },
  { key: 'prayer', name: 'Prayer', labels: { en: 'Prayer', fr: 'Prière', pt: 'Oração' }, desc: 'Addressing God in worship, intercession, confession, and thanksgiving.', head: 'phil:4:6', kind: 'TEACHING' },
  { key: 'repentance', name: 'Repentance', labels: { en: 'Repentance', fr: 'Repentance', pt: 'Arrependimento' }, desc: 'Grief over sin and a turning away from it.', head: 'act:2:38', kind: 'TOPIC' },
  { key: 'perseverance', name: 'Perseverance', labels: { en: 'Perseverance', fr: 'Persévérance', pt: 'Perseverança' }, desc: 'Steadfast endurance in faith through suffering.', head: 'jac:1:12', kind: 'TOPIC' },
  { key: 'temptation', name: 'Temptation', labels: { en: 'Temptation', fr: 'Tentation', pt: 'Tentação' }, desc: 'Allurement to sin; the testing of faith.', head: 'mat:26:41', kind: 'TOPIC' },
  { key: 'wisdom', name: 'Wisdom', labels: { en: 'Wisdom', fr: 'Sagesse', pt: 'Sabedoria' }, desc: 'Godly discernment that directs life according to God.', head: 'jac:1:5', kind: 'TOPIC' },
  { key: 'hope', name: 'Hope', labels: { en: 'Hope', fr: 'Espérance', pt: 'Esperança' }, desc: "Confident expectation of God's promises, anchored in heaven.", head: 'heb:6:19', kind: 'TOPIC' },
  { key: 'fear', name: 'Fear', labels: { en: 'Fear', fr: 'Peur', pt: 'Medo' }, desc: "Awe of God (right) or anxiety at evil (human).", head: 'deb:31:6', kind: 'TOPIC' },
  { key: 'peace', name: 'Peace', labels: { en: 'Peace', fr: 'Paix', pt: 'Paz' }, desc: 'Wholeness, rest, and fellowship with God.', head: 'phil:4:7', kind: 'TOPIC' },
  { key: 'service', name: 'Service', labels: { en: 'Service', fr: 'Service', pt: 'Serviço' }, desc: "Selfless labor for the good of others and God's work.", head: 'mar:10:45', kind: 'TOPIC' },
  // — 14 soteriological / ecclesial topics
  { key: 'justice', name: 'Justice', labels: { en: 'Justice', fr: 'Justice', pt: 'Justiça' }, desc: "God's righteous order and the call to act rightly.", head: 'rom:1:17', kind: 'TOPIC' },
  { key: 'mercy', name: 'Mercy', labels: { en: 'Mercy', fr: 'Miséricorde', pt: 'Misericórdia' }, desc: 'Compassion shown to the undeserving.', head: 'mich:7:18', kind: 'TOPIC' },
  { key: 'holiness', name: 'Holiness', labels: { en: 'Holiness', fr: 'Sainteté', pt: 'Santidade' }, desc: 'Set-apartness to God; moral purity.', head: '1pet:1:16', kind: 'TOPIC' },
  { key: 'sanctification', name: 'Sanctification', labels: { en: 'Sanctification', fr: 'Sanctification', pt: 'Santificação' }, desc: "The process of being made holy by the Spirit.", head: 'heb:12:14', kind: 'TOPIC' },
  { key: 'justification', name: 'Justification', labels: { en: 'Justification', fr: 'Justification', pt: 'Justificação' }, desc: 'Being declared righteous before God through faith.', head: 'rom:3:28', kind: 'TOPIC' },
  { key: 'regeneration', name: 'Regeneration', labels: { en: 'Regeneration', fr: 'Régénération', pt: 'Regeneração' }, desc: 'The new birth by the Holy Spirit.', head: 'joh:3:3', kind: 'TOPIC' },
  { key: 'conversion', name: 'Conversion', labels: { en: 'Conversion', fr: 'Conversion', pt: 'Conversão' }, desc: 'Turning from sin to God.', head: 'act:9:34', kind: 'TOPIC' },
  { key: 'calling', name: 'Calling', labels: { en: 'Calling', fr: 'Appel', pt: 'Chamado' }, desc: "God's summons to faith and to particular service.", head: 'gal:1:15', kind: 'TOPIC' },
  { key: 'mission', name: 'Mission', labels: { en: 'Mission', fr: 'Mission', pt: 'Missão' }, desc: "The sending of the Church into the world.", head: 'mat:28:19', kind: 'TOPIC' },
  { key: 'evangelism', name: 'Evangelism', labels: { en: 'Evangelism', fr: 'Évangélisation', pt: 'Evangelismo' }, desc: 'Proclaiming the gospel to the unsaved.', head: 'mar:16:15', kind: 'TOPIC' },
  { key: 'discipleship', name: 'Discipleship', labels: { en: 'Discipleship', fr: 'Discipulat', pt: 'Discipulado' }, desc: 'Following Christ in obedience and growth.', head: 'mat:28:20', kind: 'TOPIC' },
  { key: 'evangelistic-preaching', name: 'Evangelistic Preaching', labels: { en: 'Evangelistic Preaching', fr: 'Prédication Évangélique', pt: 'Pregação Evangelística' }, desc: 'Proclamatory ministry aimed at conversion.', head: 'act:8:12', kind: 'TEACHING' },
  { key: 'gospel', name: 'Gospel', labels: { en: 'Gospel', fr: 'Évangile', pt: 'Evangelho' }, desc: 'The good news of salvation in Christ.', head: 'mar:1:1', kind: 'TOPIC' },
  { key: 'salvation', name: 'Salvation', labels: { en: 'Salvation', fr: 'Salut', pt: 'Salvação' }, desc: 'Deliverance from sin and death through Christ.', head: 'act:4:12', kind: 'TOPIC' },
  // — 10 redemptive / eschatological events
  { key: 'the-cross', name: 'The Cross', labels: { en: 'The Cross', fr: 'La Croix', pt: 'A Cruz' }, desc: "The instrument of Christ's atoning sacrifice.", head: '1cor:1:18', kind: 'EVENT' },
  { key: 'atonement', name: 'The Atonement', labels: { en: 'The Atonement', fr: "L'Expiation", pt: 'A Expiação' }, desc: "The settlement of God's justice through Christ's death.", head: 'rom:5:8', kind: 'EVENT' },
  { key: 'resurrection', name: 'The Resurrection', labels: { en: 'The Resurrection', fr: 'La Résurrection', pt: 'A Ressurreição' }, desc: "Christ's victory over death and the assurance of ours.", head: '1cor:15:3', kind: 'EVENT' },
  { key: 'ascension', name: 'The Ascension', labels: { en: 'The Ascension', fr: "L'Ascension", pt: 'A Ascensão' }, desc: "Christ's bodily exaltation to the right hand of God.", head: 'act:1:11', kind: 'EVENT' },
  { key: 'transfiguration', name: 'The Transfiguration', labels: { en: 'The Transfiguration', fr: 'La Transfiguration', pt: 'A Transfiguração' }, desc: "Christ's glory revealed to Peter, James, and John.", head: 'luk:9:29', kind: 'EVENT' },
  { key: 'pentecost', name: 'Pentecost', labels: { en: 'Pentecost', fr: 'Pentecôte', pt: 'Pentecostes' }, desc: 'The outpouring of the Holy Spirit upon the disciples.', head: 'act:2:1', kind: 'EVENT' },
  { key: 'the-flood', name: 'The Flood', labels: { en: 'The Flood', fr: 'Le Déluge', pt: 'O Dilúvio' }, desc: "God's judgment on antediluvian corruption.", head: 'gen:6:11', kind: 'EVENT' },
  { key: 'the-exile', name: 'The Exile', labels: { en: 'The Exile', fr: "L'Exil", pt: 'O Exílio' }, desc: "Judah's Babylonian captivity after the fall of Jerusalem.", head: 'jer:25:11', kind: 'EVENT' },
  { key: 'second-coming', name: 'The Second Coming', labels: { en: 'The Second Coming', fr: 'La Seconde Venue', pt: 'A Segunda Vinda' }, desc: "Christ's return in judgment and glory.", head: 'rev:22:20', kind: 'EVENT' },
  { key: 'the-millennium', name: 'The Millennium', labels: { en: 'The Millennium', fr: 'Le Millénarium', pt: 'O Milênio' }, desc: 'The intermediate kingdom of the saints.', head: 'rev:20:4', kind: 'EVENT' },
  // — 6 OT figures & events
  { key: 'the-fall', name: 'The Fall', labels: { en: 'The Fall', fr: 'La Chute', pt: 'A Queda' }, desc: 'The first sin of Adam and Eve.', head: 'gen:3:6', kind: 'EVENT' },
  { key: 'creation', name: 'Creation', labels: { en: 'Creation', fr: 'Création', pt: 'Criação' }, desc: 'The origin of all things by the word of God.', head: 'gen:1:1', kind: 'EVENT' },
  { key: 'exodus', name: 'The Exodus', labels: { en: 'The Exodus', fr: "L'Exode", pt: 'O Êxodo' }, desc: "Israel's deliverance from Egypt.", head: 'exo:12:51', kind: 'EVENT' },
  { key: 'the-burning-bush', name: 'The Burning Bush', labels: { en: 'The Burning Bush', fr: 'Le Buisson Ardent', pt: 'A Sarça Ardente' }, desc: "God's call to Moses.", head: 'exo:3:2', kind: 'EVENT' },
  { key: 'abraham', name: 'Abraham', labels: { en: 'Abraham', fr: 'Abraham', pt: 'Abraão' }, desc: 'Father of the faithful; the covenant patriarch.', head: 'gen:12:1', kind: 'PERSON' },
  { key: 'moses', name: 'Moses', labels: { en: 'Moses', fr: 'Moïse', pt: 'Moisés' }, desc: 'The lawgiver and deliverer of Israel.', head: 'exo:3:1', kind: 'PERSON' },
  // — 6 NT figures
  { key: 'david', name: 'David', labels: { en: 'David', fr: 'David', pt: 'David' }, desc: 'King and psalmist; ancestor of Christ.', head: '1sam:16:13', kind: 'PERSON' },
  { key: 'peter', name: 'Peter', labels: { en: 'Peter', fr: 'Pierre', pt: 'Pedro' }, desc: 'Apostle, leader of the early church.', head: 'act:1:15', kind: 'PERSON' },
  { key: 'paul', name: 'Paul', labels: { en: 'Paul', fr: 'Paul', pt: 'Paulo' }, desc: 'Apostle to the Gentiles; author of many epistles.', head: 'act:9:1', kind: 'PERSON' },
  { key: 'john', name: 'John', labels: { en: 'John', fr: 'Jean', pt: 'João' }, desc: 'Beloved apostle; author of John, 1-3 John, Revelation.', head: 'joh:21:20', kind: 'PERSON' },
  { key: 'jesus', name: 'Jesus', labels: { en: 'Jesus', fr: 'Jésus', pt: 'Jesus' }, desc: 'The Christ, God incarnate, Savior of the world.', head: 'joh:1:1', kind: 'PERSON' },
  { key: 'holy-spirit', name: 'The Holy Spirit', labels: { en: 'The Holy Spirit', fr: 'Le Saint-Esprit', pt: 'O Espírito Santo' }, desc: "The third person of the Trinity; God's presence and power.", head: 'psa:139:7', kind: 'PERSON' },
  // — 4 teachings / other
  { key: 'the-law', name: 'The Law', labels: { en: 'The Law', fr: 'La Loi', pt: 'A Lei' }, desc: "God's covenantal instruction, from Moses to Christ.", head: 'deb:4:13', kind: 'TEACHING' },
  { key: 'the-psalms', name: 'The Psalms', labels: { en: 'The Psalms', fr: 'Les Psaumes', pt: 'Os Salmos' }, desc: 'The worship songbook of Israel.', head: 'psa:1:1', kind: 'OTHER' },
  { key: 'the-prophets', name: 'The Prophets', labels: { en: 'The Prophets', fr: 'Les Prophètes', pt: 'Os Profetas' }, desc: "God's messengers to Israel.", head: 'isa:20:3', kind: 'OTHER' },
  { key: 'the-temple', name: 'The Temple', labels: { en: 'The Temple', fr: 'Le Temple', pt: 'O Templo' }, desc: "God's dwelling; the place of sacrificial worship.", head: 'psa:11:4', kind: 'EVENT' },
];

/**
 * Normalize a head-verse token to the canonical `bookId:chapter:verse` key
 * (e.g. `Heb. 11:1` → `heb:11:1`).
 */
function normalizeHead(raw: string): string {
  const m = /^([a-z0-9]+)[:.\s]+(\d+)[:.\s]+(\d+)$/i.exec(raw.trim());
  if (!m) throw new Error(`seed: malformed head verse '${raw}'`);
  const b = m[1].toLowerCase();
  const c = Number(m[2]);
  const v = Number(m[3]);
  if (!Number.isInteger(c) || !Number.isInteger(v) || c < 1 || v < 1) {
    throw new Error(`seed: malformed head verse '${raw}'`);
  }
  return `${b}:${c}:${v}`;
}

/** Slug from a pipeline-key token: casefold, strip diacritics, dash-join. */
function slugOf(key: string): string {
  return stripDiacritics(casefold(key))
    .split(/[\s_-]+/)
    .filter(Boolean)
    .join('-');
}

/**
 * Export the 50-concept seed as `SeedConceptDef[]`.
 * Deterministic: ids are detUuid of the pipeline key, pinned fields.
 */
export function buildSeedConcepts(): SeedConceptDef[] {
  return DEFS.map((d) => {
    const key = `seed:${d.key}`;
    return {
      id: detUuid(`seed-concept:${key}`),
      canonical_name: d.name,
      slug: slugOf(d.key),
      labels_by_language: { ...d.labels },
      description: d.desc,
      source_provenance: 'derived',
      confidence: 1.0,
      status: 'accepted' as const,
      key,
      head_verse: normalizeHead(d.head),
      kind: d.kind,
    };
  });
}

export default buildSeedConcepts;
