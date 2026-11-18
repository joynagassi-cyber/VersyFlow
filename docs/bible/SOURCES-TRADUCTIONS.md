# Sources de traductions bibliques — état, licences, téléchargement

**Date** : 2026-10-30 · **Objet** : disposer de traductions libres, multilingues, convertibles en JSON, et corriger le rendu des versets.

---

## 1. Bible-Discovery : ce que j'ai pu vérifier, et pourquoi ce n'est pas la bonne source

| Tentative | Résultat |
| --- | --- |
| `https://www.bible-discovery.com/` | **Mur anti-robot** (« Access to this file or directory is not permitted to automated programs »), captcha mediacenter.hu |
| `https://www.bible-discovery.com/bible-download` | idem |
| `https://www.bible-discovery.com/bibles` | idem |

Je n'ai donc **pas pu consulter son catalogue** : toute liste que je te donnerais « d'après Bible-Discovery » serait inventée. Je ne le fais pas.

Deux obstacles de fond, même si l'accès était possible :

1. **Format et licence.** Bible-Discovery distribue ses modules (`.bbli`) depuis l'application, avec un mélange de modules gratuits et payants. Ce sont des archives propriétaires, pas des fichiers USFM/JSON. Les redistribuer dans une application publiée sur les stores suppose des droits que le site ne concède pas.
2. **Traçabilité.** Aucun identifiant de licence par module, donc impossible de prouver à Google Play / Apple que le texte est libre.

**Conclusion** : Bible-Discovery reste un excellent outil d'étude personnel ; ce n'est pas une source de données pour VersyFlow.

---

## 2. La source utilisée par le projet (et la bonne) : eBible.org

Le dépôt s'appuie déjà dessus (`scripts/bible/ebible_fetch.py`, `ebible_catalog.py`). eBible publie un **scorecard officiel** (`https://ebible.org/Scriptures/scorecard.txt`, en-tête « as of Tue, 17 Nov 2026 ») :

| Mesure officielle | Valeur |
| --- | --- |
| Traductions **librement redistribuables** | **1 296** |
| Langues couvertes | **1 024** (1 115 dialectes) |
| Traductions à partage limité | 252 |
| Traductions publiques au total | 1 548 |
| Traductions avec audio | 79 |

Répartition officielle des langues qui ont **plusieurs** traductions libres (extrait du scorecard, la liste complète y figure) :

| Langue | Traductions libres | Langue | Traductions libres |
| --- | --- | --- | --- |
| anglais `eng` | 58 | français `fra` | **5** |
| sanskrit `san` | 22 | allemand `deu` | 5 |
| espagnol `spa` | 12 | ourdou `urd` | 5 |
| grec `grc` | 10 | ukrainien `ukr` | 4 |
| chinois `cmn` | 9 | néerlandais `nld` | 4 |
| portugais `por` | 7 | hébreu `heb` | 4 |
| roumain `ron` | 5 | serbe `srp` | 4 |
| hindi `hin` | 3 | indonésien `ind` | 3 |

> Règle de lecture du site : dans `https://ebible.org/find/`, **fond blanc = redistribuable**, fond gris = reproduction interdite sans l'accord de l'ayant droit.

### Le catalogue déjà validé dans le dépôt

`docs/bible/BIBLE_TRANSLATION_CATALOG.json` : **39 entrées, 24 langues, 38 `VERIFIED_FREE`** (seul *Darby 1865* est en `LICENSE_REQUIRED`).

| Langue | Id interne | Id eBible | Traduction | Licence |
| --- | --- | --- | --- | --- |
| fr | `lsg` | `fraLSG` | Louis Segond 1910 | domaine public |
| fr | `ostervald` | — | Ostervald 1930 | libre (local) |
| fr | `frlsg-eb` | `fraLSG` | Louis Segond (édition eBible) | domaine public |
| fr | `francrampon` | `francl` | Néo-Crampon Libre | libre |
| en | `web` / `webu` | `engwebp` / `engwebu` | World English Bible (+ Updated) | domaine public |
| en | `kujv` | `engkjvcpb` | King James (CPB) | libre |
| es | `rv1909` / `es-onbv` / `es-godword` | `spaRV1909` / `spaonbv` / `spapddpt` | Reina-Valera 1909, ONBV, God's Word | libres |
| pt | `pt-onbv` | `poronbv` | ONBV portugais | libre |
| de | `luther1912` / `schlatter1951` | `deu1912` / `deu1951` | Luther 1912, Schlatter 1951 | libres |
| ru | `ru-synodal` | `russyn` | Synodal russe | libre |
| uk | `uk-bju1996` / `uk-kulish1871` | `ukr1996` / `ukr1871` | BJU 1996, Kulish 1871 | libres |
| it | `it-diodati1885` / `it-riveduta1927` | `ita1885` / `ita1927` | Diodati 1885, Riveduta 1927 | libres |
| ar | `ar-nav` | `arbnav` | New Arabic Version | libre |
| zh | `cmn-uvs` / `cmnswcb` / `cmn-cob` | `cmn` / `cmnswcb` / `cmncbs` | Union, World Chinese, Open Contemporary | libres |
| ko | `ko-1910` | `kor` | Coréen 1910 | libre |
| ja | `jp-freedom` | `jpnm` | Freedom Bible | libre |
| fa | `fa-opcb` | `pesopcb` | Open Persian Contemporary | libre |
| tl | `tl-ulb` | `tglulb` | Tagalog ULB | libre |
| sw | `sw-ulb` | `swhulb` | Swahili ULB | libre |
| nl | `nl-1917` / `nl-nbg1951` | `nld` / `nldnbg` | 1917, NBG 1951 | libres |
| id | `id-tsi` | `ind` | Indonésien TSI | libre |
| hi | `hi-irv` | `hin2017` | Hindi IRV | libre |
| ml | `ml-irv` | `mal` | Malayalam IRV | libre |
| sv | `sv-folk` / `sv-ntplus` | `swef` / `swe` | Folkbibeln, NT+ | libres |
| da | `da-1931` | `dan1931` | Danois 1931 | libre |
| so | `so-bible` | `som` | Somali | libre |
| la | `la-vulgate` | `latVUC` | Vulgate clémentine 1598 | libre |
| he | `he-wlc` | `hebwlc` | Westminster Leningrad Codex | libre |

D'autres ids du catalogue applicatif (57 au total) viennent de corpus locaux ou d'autres pipelines : `asv`, `bsb`, `rv1909`, `urd-irv`, `bn-irv`, `ta-irv`, `te-irv`, `myajvb`, `ha-ulb`, `ig-ulb`, `yo-ulb`, `ku-sorani`, `st-hone`, `vie1934`, `heb`, `web`…

---

## 3. Comment télécharger (URL exactes)

Pour une traduction d'id eBible `XXX` (ex. `fraLSG`), les archives publiques sont :

| Format | URL | Usage chez nous |
| --- | --- | --- |
| **USFM** | `https://ebible.org/Scriptures/XXX_usfm.zip` | **source de référence** (structure `\c`, `\v`, notes) |
| **VPL** (verset par ligne) | `https://ebible.org/Scriptures/XXX_vpl.zip` | le plus simple pour produire du JSON propre |
| USFX | `https://ebible.org/Scriptures/XXX_usfx.zip` | alternative XML |
| HTML mobile | `https://ebible.org/Scriptures/XXX_html.zip` | contrôle visuel |
| ePub | `https://ebible.org/epub/XXX.epub` | lecture |
| SWORD | `https://ebible.org/sword/zip/XXX1910eb.zip` | omet |
| Fiche + licence | `https://ebible.org/find/details.php?id=XXX` | **à consulter avant tout ajout** |

### Dans le dépôt

```bash
# 1. télécharger (USFM non dézippé dans data/bible/raw/{lang}/)
python scripts/bible/ebible_fetch.py fraLSG engwebp spaRV1909

# 2. construire les JSON applicatifs (USFM → document canonique)
npm run bible:build -- frlsg-eb web rv1909

# 3. régénérer le manifeste de checksums
npm run bible:catalog

# 4. vérifier / réparer le TEXTE (voir §4)
node scripts/bible/normalize-bible-datasets.mjs --check

# 5. publier le fichier par défaut servi par l'app (lsg uniquement)
node scripts/copy-bible-bundled.mjs
```

> Le script `ebible_fetch.py` documente un point vérifié : `details.php` exige une session cookie, mais les URL `https://ebible.org/Scriptures/{id}_usfm.zip` sont publiques. Utilise un `User-Agent` normal.

### Avant d'ajouter une langue

1. Ouvrir `https://ebible.org/find/details.php?id=XXX` et vérifier la mention **Public Domain / freely redistributable** (ou la licence CC indiquée).
2. Ajouter l'entrée dans `docs/bible/BIBLE_TRANSLATION_CATALOG.json` avec `license: VERIFIED_FREE` et l'URL de la fiche en commentaire.
3. Ne jamais activer une traduction dont la fiche dit « may not be redistributed without permission ».

---

## 4. Pourquoi les versets affichaient des caractères cassés — et ce qui a été corrigé

### Défaut n°1 — espace après l'apostrophe (les « j » et « l » orphelins)

Mesuré sur `data/bible/lsg.json` **avant** correction :

| Mesure | Valeur |
| --- | --- |
| Versets | 31 170 |
| Versets contenant `’ ` (apostrophe + espace) | **21 128 (67,8 %)** |
| Élisions fautives | **41 594** — `l’` 16 483 · `d’` 8 138 · `n’` 3 060 · `s’` 2 916 · `c’` 2 271 · `j’` 1 793 · `m’` 1 143 · `t’` 847 · `qu’` 4 943 |

Exemple réel (Genèse 1:2, avant) : `… à la surface de l’ abîme, et l’ esprit de Dieu …`
Après : `… à la surface de l’abîme, et l’esprit de Dieu …`

C'est exactement ce que tu voyais : la lettre élidée se détache (« j », « l », « qu ») et se retrouve seule en fin de ligne ou isolée dans le flux du texte.

### Défaut n°2 — la lettre « w » supprimée dans tous les mots

Dans `src/infrastructure/bible/adapters/usfm-adapter.ts`, le nettoyage des marqueurs USFM `\w … \w*` utilisait `/\\?\+?w\*?/` : le backslash était **optionnel**, donc l'expression supprimait aussi tout « w » ordinaire. Vérifié à l'exécution :

```
"New world of wonder"  →  "Ne orld of onder"
```

Le défaut touchait **tous** les jeux produits par cet adaptateur (57 traductions au catalogue), pas seulement le français — invisible en LSG (le français n'emploie presque pas « w »), dévastateur en anglais.

### Corrections appliquées

| Fichier | Changement |
| --- | --- |
| `src/infrastructure/bible/adapters/usfm-adapter.ts` | backslash obligatoire pour les marqueurs `\w` ; attributs `|strong="…"` retirés séparément ; backslash résiduels retirés en dernier ; nouvelle fonction `normalizeElisions()` ; NFC |
| `scripts/bible/normalize-bible-datasets.mjs` | **nouveau** : répare les JSON déjà construits, met à jour les checksums du manifeste, `--check` pour la CI |
| `data/bible/lsg.json` + `public/data/bible/lsg.json` | 21 128 versets corrigés, 0 élision fautive restante |
| `tests/unit/usfm-adapter.test.ts` | +5 tests (w préservé, marqueurs, élisions, citation anglaise, idempotence) — 16/16 verts |

Les règles sont volontairement **restreintes** aux tokens d'élision (`l, d, j, qu, s, n, c, m, t, jusqu, lorsqu, puisqu, quoiqu`) : une règle générale « toute apostrophe suivie d'une espace » souderait les apostrophes de citation des corpus anglais (`‘Peace’ and`).

---

## 5. Bon rendu : les règles à appliquer à tout nouveau JSON

| Règle | Pourquoi | Où c'est appliqué |
| --- | --- | --- |
| **NFC** (Unicode composé) | évite les accents détachés | `normalizeElisions` / script |
| **Apostrophe typographique `’`**, jamais `'` | cohérence française et belle typographie | adaptateur |
| **Aucune espace après l'apostrophe d'élision** | sinon lettres orphelines | adaptateur + script |
| Aucune espace avant `, ; : ! ?` | typographie française | adaptateur + script |
| `\u00A0` (insécable) avant `:` `;` `!` `?` et dans `« »` | rendu FR correct — **à faire côté composant**, pas dans le texte stocké | à ajouter dans le reader |
| Aucun marqueur USFM résiduel (`\add`, `\w`, `\|`) | texte brut affichable | adaptateur (testé) |
| Sens d'écriture : `dir="rtl"` pour `ar, he, fa, ur` | sinon ponctuation inversée | `src/styles/globals.css` (à vérifier par langue) |
| Polices : Noto par script (arabe, devanagari, bengali, tamoul) | sinon tofu `□□□` | à vérifier sur les 45 locales |
| Segmenter par verset, jamais re-découper à l'affichage | garantit la stabilité du texte mémorisé | schéma `{number, text}` |

### Schéma JSON attendu par l'application

```json
{
  "id": "lsg",
  "language": "fr",
  "name": "Louis Segond (1910)",
  "year": 1910,
  "books": [
    {
      "id": "GEN",
      "name": { "fr": "GEN", "en": "GEN" },
      "testament": "OT",
      "chapterCount": 50,
      "chapters": [
        { "number": 1, "verses": [{ "number": 1, "text": "Au commencement, Dieu créa les cieux et la terre." }] }
      ]
    }
  ]
}
```

Le champ `name` ne contient que des **sigles** dans le dataset ; les noms complets viennent de `src/domains/bible/entities.ts` via `useBibleBooks` (correctif d'octobre).

---

## 6. Ce qui reste à faire

| Étape | État |
| --- | --- |
| Diagnostic et correction des deux défauts de texte | **fait et mesuré** |
| LSG nettoyée et servie par l'app | **fait** (5,07 Mo, 0 élision fautive) |
| Test de non-régression sur l'adaptateur | **fait** (16 tests) |
| Script de réparation réutilisable + `--check` | **fait** |
| Inventaire des 1 296 traductions libres | **non fait** — nécessite un accès réseau à ebible.org (bloqué depuis cet environnement) ; la liste est consultable sur `ebible.org/find/` |
| Reconstruction des 56 autres jeux (hors LSG) | **non fait** — sources USFM absentes du poste (`data/bible/raw/`) ; les reconstruire avec `npm run bible:build` une fois les sources récupérées les rendra propres d'office |
| Vérification visuelle des 45 locales (RTL, polices) | **non fait** |
