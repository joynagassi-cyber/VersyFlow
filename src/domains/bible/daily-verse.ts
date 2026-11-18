/**
 * Le verset du jour — une seule source, hors ligne.
 *
 * Règles tenues par ce module (et vérifiées par `tests/design/daily-verse.test.ts`) :
 *
 *  · **déterministe** : la sélection ne dépend que du jour calendaire local.
 *    Recharger l'app, changer de fuseau en cours de journée ou rouvrir hors
 *    ligne donne le même verset ; le lendemain, un autre ;
 *  · **un verset différent chaque jour** : le pas de parcours (13) est premier
 *    avec la longueur de la liste, donc deux jours consécutifs ne tombent
 *    jamais sur la même entrée, et le cycle ne se referme qu'après N jours ;
 *  · **hors ligne** : les textes sont embarqués (LSG, domaine public) et
 *    l'illustration pointe une image locale du catalogue de thèmes — aucune
 *    requête réseau, ni pour le texte, ni pour l'image ;
 *  · **l'image parle du verset** : `visual` est un thème choisi pour son sens
 *    (Psaume 23 → l'agneau, Ésaïe 40 → l'aigle, Jean 8:12 → les phares), plus
 *    un paysage générique tiré au hasard.
 */

export interface DailyVerse {
  /** Identifiant stable, ex. `joh-3-16`. */
  readonly id: string;
  /** Référence affichable, ex. « Jean 3:16 ». */
  readonly reference: string;
  /** Texte LSG (domaine public), en ligne dans le bundle. */
  readonly text: string;
  /** Thème visuel du catalogue (`public/themes/<catégorie>/<id>-landscape.*`). */
  readonly visual: string;
  /** Famille de sens, pour l'illustration et l'accessibilité. */
  readonly theme: string;
  readonly book: string;
  readonly chapter: number;
  readonly verse: number;
}

/** Date de référence du cycle : le 1er janvier 2026, en temps universel. */
const CYCLE_EPOCH_UTC = Date.UTC(2026, 0, 1);
const MS_PER_DAY = 86_400_000;

/**
 * Pas du parcours. 13 est premier avec 49 (longueur de la liste) : le cycle
 * passe par les 49 entrées avant de se refermer, dans un ordre qui ne laisse
 * jamais deux versets du même registre se suivre.
 */
const STRIDE = 13;

export const DAILY_VERSES: readonly DailyVerse[] = [
  {
    id: 'joh-3-16',
    reference: 'Jean 3:16',
    text:
      'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.',
    visual: 'lum-sunrise',
    theme: 'amour',
    book: 'joh',
    chapter: 3,
    verse: 16,
  },
  {
    id: 'psa-23-1',
    reference: 'Psaumes 23:1',
    text:
      'L’Éternel est mon berger: je ne manquerai de rien.',
    visual: 'ani-agneau',
    theme: 'confiance',
    book: 'psa',
    chapter: 23,
    verse: 1,
  },
  {
    id: 'phil-4-13',
    reference: 'Philippiens 4:13',
    text:
      'Je puis tout par celui qui me fortifie.',
    visual: 'nat-mont',
    theme: 'force',
    book: 'phil',
    chapter: 4,
    verse: 13,
  },
  {
    id: 'rom-8-28',
    reference: 'Romains 8:28',
    text:
      'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
    visual: 'nat-sun',
    theme: 'esperance',
    book: 'rom',
    chapter: 8,
    verse: 28,
  },
  {
    id: 'isa-40-31',
    reference: 'Ésaïe 40:31',
    text:
      'Mais ceux qui se confient en l’Éternel renouvellent leur force. Ils prennent le vol comme les aigles; Ils courent, et ne se lassent point, Ils marchent, et ne se fatiguent point.',
    visual: 'ani-aigle',
    theme: 'esperance',
    book: 'isa',
    chapter: 40,
    verse: 31,
  },
  {
    id: 'jer-29-11',
    reference: 'Jérémie 29:11',
    text:
      'Car je connais les projets que j’ai formés sur vous, dit l’Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l’espérance.',
    visual: 'nat-trees',
    theme: 'esperance',
    book: 'jer',
    chapter: 29,
    verse: 11,
  },
  {
    id: 'prov-3-5',
    reference: 'Proverbes 3:5',
    text:
      'Confie-toi en l’Éternel de tout ton cœur, Et ne t’appuie pas sur ta sagesse;',
    visual: 'sag-livre',
    theme: 'confiance',
    book: 'prov',
    chapter: 3,
    verse: 5,
  },
  {
    id: 'mat-11-28',
    reference: 'Matthieu 11:28',
    text:
      'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
    visual: 'frat-mains',
    theme: 'repos',
    book: 'mat',
    chapter: 11,
    verse: 28,
  },
  {
    id: 'jos-1-9',
    reference: 'Josué 1:9',
    text:
      'Ne t’ai-je pas donné cet ordre: Fortifie-toi et prends courage? Ne t’effraie point et ne t’épouvante point, car l’Éternel, ton Dieu, est avec toi dans tout ce que tu entreprendras.',
    visual: 'nat-mont',
    theme: 'courage',
    book: 'jos',
    chapter: 1,
    verse: 9,
  },
  {
    id: 'psa-119-105',
    reference: 'Psaumes 119:105',
    text:
      'Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.',
    visual: 'lum-lamp',
    theme: 'direction',
    book: 'psa',
    chapter: 119,
    verse: 105,
  },
  {
    id: 'gal-5-22',
    reference: 'Galates 5:22',
    text:
      'Mais le fruit de l’Esprit, c’est l’amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance;',
    visual: 'esprit-olivier',
    theme: 'esprit',
    book: 'gal',
    chapter: 5,
    verse: 22,
  },
  {
    id: 'eph-2-8',
    reference: 'Éphésiens 2:8',
    text:
      'Car c’est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c’est le don de Dieu.',
    visual: 'lum-diamant',
    theme: 'grace',
    book: 'eph',
    chapter: 2,
    verse: 8,
  },
  {
    id: '1cor-13-13',
    reference: '1 Corinthiens 13:13',
    text:
      'Maintenant donc ces trois choses demeurent: la foi, l’espérance, la charité; mais la plus grande de ces choses, c’est la charité.',
    visual: 'frat-cord',
    theme: 'amour',
    book: '1cor',
    chapter: 13,
    verse: 13,
  },
  {
    id: 'psa-27-1',
    reference: 'Psaumes 27:1',
    text:
      'L’Éternel est ma lumière et mon salut: De qui aurais-je crainte? L’Éternel est le soutien de ma vie: De qui aurais-je peur?',
    visual: 'lum-bougie',
    theme: 'lumiere',
    book: 'psa',
    chapter: 27,
    verse: 1,
  },
  {
    id: 'isa-41-10',
    reference: 'Ésaïe 41:10',
    text:
      'Ne crains rien, car je suis avec toi; Ne promène pas des regards inquiets, car je suis ton Dieu; Je te fortifie, je viens à ton secours, Je te soutiens de ma droite triomphante.',
    visual: 'frat-mains',
    theme: 'courage',
    book: 'isa',
    chapter: 41,
    verse: 10,
  },
  {
    id: 'mat-6-33',
    reference: 'Matthieu 6:33',
    text:
      'Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.',
    visual: 'lum-etoile',
    theme: 'priorite',
    book: 'mat',
    chapter: 6,
    verse: 33,
  },
  {
    id: 'joh-14-6',
    reference: 'Jean 14:6',
    text:
      'Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.',
    visual: 'obj-cle',
    theme: 'verite',
    book: 'joh',
    chapter: 14,
    verse: 6,
  },
  {
    id: 'heb-11-1',
    reference: 'Hébreux 11:1',
    text:
      'Or la foi est une ferme assurance des choses qu’on espère, une démonstration de celles qu’on ne voit pas.',
    visual: 'obj-anchor',
    theme: 'foi',
    book: 'heb',
    chapter: 11,
    verse: 1,
  },
  {
    id: '1joh-4-19',
    reference: '1joh 4:19',
    text:
      'Pour nous, nous l’aimons, parce qu’il nous a aimés le premier.',
    visual: 'frat-cord',
    theme: 'amour',
    book: '1joh',
    chapter: 4,
    verse: 19,
  },
  {
    id: 'lament-3-22',
    reference: 'Lamentations 3:22',
    text:
      'Les bontés de l’Éternel ne sont pas épuisées, Ses compassions ne sont pas à leur terme;',
    visual: 'sai-dawn',
    theme: 'misericorde',
    book: 'lament',
    chapter: 3,
    verse: 22,
  },
  {
    id: 'mich-6-8',
    reference: 'Michée 6:8',
    text:
      'On t’a fait connaître, ô homme, ce qui est bien; Et ce que l’Éternel demande de toi, C’est que tu pratiques la justice, Que tu aimes la miséricorde, Et que tu marches humblement avec ton Dieu.',
    visual: 'sag-tri',
    theme: 'justice',
    book: 'mich',
    chapter: 6,
    verse: 8,
  },
  {
    id: 'psa-91-1',
    reference: 'Psaumes 91:1',
    text:
      'Celui qui demeure sous l’abri du Très-Haut Repose à l’ombre du Tout-Puissant.',
    visual: 'nat-ocean',
    theme: 'protection',
    book: 'psa',
    chapter: 91,
    verse: 1,
  },
  {
    id: 'deb-31-6',
    reference: 'Deutéronome 31:6',
    text:
      'Fortifiez-vous et ayez du courage! Ne craignez point et ne soyez point effrayés devant eux; car l’Éternel, ton Dieu, marchera lui-même avec toi, il ne te délaissera point, il ne t’abandonnera point.',
    visual: 'nat-cactus',
    theme: 'courage',
    book: 'deb',
    chapter: 31,
    verse: 6,
  },
  {
    id: '2tim-1-7',
    reference: '2 Timothée 1:7',
    text:
      'Car ce n’est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d’amour et de sagesse.',
    visual: 'esprit-feu',
    theme: 'courage',
    book: '2tim',
    chapter: 1,
    verse: 7,
  },
  {
    id: 'jac-1-5',
    reference: 'Jacques 1:5',
    text:
      'Si quelqu’un d’entre vous manque de sagesse, qu’il la demande à Dieu, qui donne à tous simplement et sans reproche, et elle lui sera donnée.',
    visual: 'sag-livre',
    theme: 'sagesse',
    book: 'jac',
    chapter: 1,
    verse: 5,
  },
  {
    id: '1pet-5-7',
    reference: '1 Pierre 5:7',
    text:
      'et déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.',
    visual: 'frat-pains',
    theme: 'repos',
    book: '1pet',
    chapter: 5,
    verse: 7,
  },
  {
    id: 'psa-139-14',
    reference: 'Psaumes 139:14',
    text:
      'Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables, Et mon âme le reconnaît bien.',
    visual: 'sai-fleur',
    theme: 'identite',
    book: 'psa',
    chapter: 139,
    verse: 14,
  },
  {
    id: 'col-3-23',
    reference: 'Colossiens 3:23',
    text:
      'Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes,',
    visual: 'sag-plume',
    theme: 'travail',
    book: 'col',
    chapter: 3,
    verse: 23,
  },
  {
    id: 'joh-8-12',
    reference: 'Jean 8:12',
    text:
      'Jésus leur parla de nouveau, et dit: Je suis la lumière du monde; celui qui me suit ne marchera pas dans les ténèbres, mais il aura la lumière de la vie.',
    visual: 'lum-phares',
    theme: 'lumiere',
    book: 'joh',
    chapter: 8,
    verse: 12,
  },
  {
    id: 'psa-121-1',
    reference: 'Psaumes 121:1',
    text:
      'Je lève mes yeux vers les montagnes… D’où me viendra le secours?',
    visual: 'nat-mont',
    theme: 'protection',
    book: 'psa',
    chapter: 121,
    verse: 1,
  },
  {
    id: 'isa-26-3',
    reference: 'Ésaïe 26:3',
    text:
      'A celui qui est ferme dans ses sentiments Tu assures la paix, la paix, Parce qu’il se confie en toi.',
    visual: 'sai-neige',
    theme: 'paix',
    book: 'isa',
    chapter: 26,
    verse: 3,
  },
  {
    id: 'mat-5-14',
    reference: 'Matthieu 5:14',
    text:
      'Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée;',
    visual: 'lum-lanter',
    theme: 'lumiere',
    book: 'mat',
    chapter: 5,
    verse: 14,
  },
  {
    id: 'joh-15-5',
    reference: 'Jean 15:5',
    text:
      'Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.',
    visual: 'nat-fleurs',
    theme: 'fruits',
    book: 'joh',
    chapter: 15,
    verse: 5,
  },
  {
    id: 'psa-37-4',
    reference: 'Psaumes 37:4',
    text:
      'Fais de l’Éternel tes délices, Et il te donnera ce que ton cœur désire.',
    visual: 'sai-printemps',
    theme: 'joie',
    book: 'psa',
    chapter: 37,
    verse: 4,
  },
  {
    id: 'prov-16-3',
    reference: 'Proverbes 16:3',
    text:
      'Recommande à l’Éternel tes œuvres, Et tes projets réussiront.',
    visual: 'sag-colonne',
    theme: 'travail',
    book: 'prov',
    chapter: 16,
    verse: 3,
  },
  {
    id: 'rom-12-2',
    reference: 'Romains 12:2',
    text:
      'Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l’intelligence, afin que vous discerniez quelle est la volonté de Dieu, ce qui est bon, agréable et parfait.',
    visual: 'esprit-nouvel',
    theme: 'renouvellement',
    book: 'rom',
    chapter: 12,
    verse: 2,
  },
  {
    id: '2cor-5-17',
    reference: '2 Corinthiens 5:17',
    text:
      'Si quelqu’un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.',
    visual: 'sai-printemps',
    theme: 'renouvellement',
    book: '2cor',
    chapter: 5,
    verse: 17,
  },
  {
    id: 'gal-2-20',
    reference: 'Galates 2:20',
    text:
      'J’ai été crucifié avec Christ; et si je vis, ce n’est plus moi qui vis, c’est Christ qui vit en moi; si je vis maintenant dans la chair, je vis dans la foi au Fils de Dieu, qui m’a aimé et qui s’est livré lui-même pour moi.',
    visual: 'ev-pasque',
    theme: 'grace',
    book: 'gal',
    chapter: 2,
    verse: 20,
  },
  {
    id: 'eph-3-20',
    reference: 'Éphésiens 3:20',
    text:
      'Or, à celui qui peut faire, par la puissance qui agit en nous, infiniment au-delà de tout ce que nous demandons ou pensons,',
    visual: 'nat-sun',
    theme: 'puissance',
    book: 'eph',
    chapter: 3,
    verse: 20,
  },
  {
    id: 'phil-4-6',
    reference: 'Philippiens 4:6',
    text:
      'Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.',
    visual: 'frat-lantern',
    theme: 'paix',
    book: 'phil',
    chapter: 4,
    verse: 6,
  },
  {
    id: 'heb-13-8',
    reference: 'Hébreux 13:8',
    text:
      'Jésus-Christ est le même hier, aujourd’hui, et éternellement.',
    visual: 'obj-sceau',
    theme: 'fidelite',
    book: 'heb',
    chapter: 13,
    verse: 8,
  },
  {
    id: 'rev-21-4',
    reference: 'Apocalypse 21:4',
    text:
      'Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n’y aura plus ni deuil, ni cri, ni douleur, car les premières choses ont disparu.',
    visual: 'frat-rainbow',
    theme: 'consolation',
    book: 'rev',
    chapter: 21,
    verse: 4,
  },
  {
    id: 'psa-100-5',
    reference: 'Psaumes 100:5',
    text:
      'Car l’Éternel est bon; sa bonté dure toujours, Et sa fidélité de génération en génération.',
    visual: 'sai-ete',
    theme: 'louange',
    book: 'psa',
    chapter: 100,
    verse: 5,
  },
  {
    id: 'exo-14-14',
    reference: 'Exode 14:14',
    text:
      'L’Éternel combattra pour vous; et vous, gardez le silence.',
    visual: 'nat-ocean',
    theme: 'delivrance',
    book: 'exo',
    chapter: 14,
    verse: 14,
  },
  {
    id: 'neh-8-10',
    reference: 'Néhémie 8:10',
    text:
      'Ils leur dirent: Allez, mangez des viandes grasses et buvez des liqueurs douces, et envoyez des portions à ceux qui n’ont rien de préparé, car ce jour est consacré à notre Seigneur; ne vous affligez pas, car la joie de l’Éternel sera votre force.',
    visual: 'frat-table',
    theme: 'joie',
    book: 'neh',
    chapter: 8,
    verse: 10,
  },
  {
    id: 'isa-43-2',
    reference: 'Ésaïe 43:2',
    text:
      'Si tu traverses les eaux, je serai avec toi; Et les fleuves, ils ne te submergeront point; Si tu marches dans le feu, tu ne te brûleras pas, Et la flamme ne t’embrasera pas.',
    visual: 'esprit-eau',
    theme: 'protection',
    book: 'isa',
    chapter: 43,
    verse: 2,
  },
  {
    id: 'psa-46-2',
    reference: 'Psaumes 46:2',
    text:
      'Dieu est pour nous un refuge et un appui, Un secours qui ne manque jamais dans la détresse.',
    visual: 'nat-mont',
    theme: 'refuge',
    book: 'psa',
    chapter: 46,
    verse: 2,
  },
  {
    id: 'joh-10-11',
    reference: 'Jean 10:11',
    text:
      'Je suis le bon berger. Le bon berger donne sa vie pour ses brebis.',
    visual: 'ani-agneau',
    theme: 'berger',
    book: 'joh',
    chapter: 10,
    verse: 11,
  },
  {
    id: 'psa-34-9',
    reference: 'Psaumes 34:9',
    text:
      'Sentez et voyez combien l’Éternel est bon! Heureux l’homme qui cherche en lui son refuge!',
    visual: 'sai-autome',
    theme: 'louange',
    book: 'psa',
    chapter: 34,
    verse: 9,
  },
  {
    id: 'sep-3-17',
    reference: 'Sophonie 3:17',
    text:
      'L’Éternel, ton Dieu, est au milieu de toi, comme un héros qui sauve; Il fera de toi sa plus grande joie; Il gardera le silence dans son amour; Il aura pour toi des transports d’allégresse.',
    visual: 'frat-grenade',
    theme: 'joie',
    book: 'sep',
    chapter: 3,
    verse: 17,
  },];

export const DAILY_VERSE_CYCLE_LENGTH = DAILY_VERSES.length;

/** Numéro de jour local depuis l'époque du cycle (peut être négatif). */
export function dayNumber(date: Date = new Date()): number {
  const localMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((localMidnight - CYCLE_EPOCH_UTC) / MS_PER_DAY);
}

/** Index dans `DAILY_VERSES` pour un jour donné — toujours dans [0, longueur). */
export function dailyVerseIndex(date: Date = new Date()): number {
  const length = DAILY_VERSES.length;
  const day = dayNumber(date);
  return ((day * STRIDE) % length + length) % length;
}

/** Le verset du jour. Pure : même date → même verset, sans effet de bord. */
export function getDailyVerse(date: Date = new Date()): DailyVerse {
  return DAILY_VERSES[dailyVerseIndex(date)];
}

/**
 * Les `days` prochains versets, à partir d'aujourd'hui inclus.
 * Sert à programmer les notifications sans réseau : chaque jour reçoit son
 * texte au moment de la programmation, pas une notification générique.
 */
export function getUpcomingDailyVerses(days: number, from: Date = new Date()): DailyVerse[] {
  const count = Math.max(0, Math.floor(days));
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    return getDailyVerse(date);
  });
}
