# MASTER BIBLE CORPUS PROMPT — Source de Vérité du Corpus Biblique VersyFlow

> **Statut : source de vérité de l'exécution du corpus biblique.**
> Tout agent qui touche au corpus biblique doit lire ce fichier en entier avant d'agir.
> Ce prompt est la référence exécutoire : les décisions ci-dessous priment sur tout
> ce qui a pu être fait dans des sessions précédentes (notamment le bricolage du
> parseur LSG). Ne rétro-agir jamais vers une approche traduction-par-traduction.

## Index de conformité (lecture rapide)

- §0 Sauvegarde du prompt — fait (ce fichier).
- §4 Interdiction de traiter les Bibles une par une — loi absolue.
- §2 / §56 / §57 Runtime = **JSON embarqué** (décision produit, voir §DÉCISIONS LOCALES).
- §50 / §51 / §52 Parser générique testé sur 5 styles USFM + validation corpus.
- §71 / §72 AUDIT → PLAN → REVIEW → IMPLÉMENTATION (pas AUDIT → CODE).
- §61-§68 Batch build tolérant aux pannes dataset.
- §76 Test ultime d'architecture : une nouvelle traduction USFM s'ingère sans
  toucher au moteur de mémorisation, au domaine, à la UI.

---

# SYSTEM PROMPT — VERSYFLOW

# UNIVERSAL BIBLE CORPUS ENGINE

# MULTI-LANGUAGE / MULTI-TRANSLATION / BATCH INGESTION

---

# 0. INSTRUCTION CRITIQUE — À LIRE EN PREMIER

**STOP. NE COMMENCE PAS PAR MODIFIER LE CODE.**

Tu dois lire **L'INTÉGRALITÉ de ce prompt avant toute action technique**.

Ne te contente pas du début et de la fin.

Après lecture complète :

1. crée immédiatement un fichier :

```text
docs/bible/MASTER_BIBLE_CORPUS_PROMPT.md
```

2. copie dans ce fichier **la totalité du présent prompt** ;
3. vérifie que le fichier contient bien l'intégralité du prompt ;
4. ensuite seulement commence l'audit du dépôt.

Ce fichier devient une **source de vérité de l'exécution du corpus biblique**.

Tu ne dois pas prétendre avoir lu le prompt complet si tu ne l'as pas enregistré et vérifié.

---

# 1. MISSION

Tu es responsable de construire le **système universel de gestion du corpus biblique de VersyFlow**.

Tu ne dois PAS traiter les traductions une par une comme des projets indépendants.

Tu dois construire un **Bible Corpus Engine générique** capable de gérer automatiquement :

- plusieurs langues ;
- plusieurs traductions par langue ;
- plusieurs formats source ;
- plusieurs canons ;
- plusieurs systèmes de versification ;
- plusieurs scripts d'écriture ;
- plusieurs directions d'écriture ;
- plusieurs niveaux de complétude ;
- plusieurs licences ;
- plusieurs sources ;
- plusieurs variantes d'une même traduction.

Le système doit pouvoir ajouter une nouvelle traduction essentiellement par :

```text
REGISTRY ENTRY
+
DATASET
```

et non par modification du moteur.

---

# 2. DÉCISION PRODUIT DÉFINITIVE — TOUT EST EMBARQUÉ

La décision produit actuelle est :

> **Toutes les traductions bibliques retenues et légalement redistribuables sont embarquées dans l'application VersyFlow.**

Ne propose plus :

- téléchargement à la demande ;
- language packs externes ;
- translation packs externes ;
- CDN biblique ;
- téléchargement après installation ;
- dépendance à une API Bible.

La taille de l'application est volontairement assumée.

Une application de plusieurs centaines de mégaoctets est acceptable dans la stratégie actuelle.

Le corpus biblique complet retenu doit donc être préparé pour être **embarqué dans le produit final**.

> **DÉCISION LOCALE (VersyFlow, session 2026-09-12)** : la représentation runtime
> retenue par l'architecture VersyFlow est le **JSON embarqué** (un dataset par
> traduction : `data/bible/{translation-id}.json`), consommé par le repository
> local pur (`src/domains/bible/repository-local.ts`) et l'unique lecteur
> `src/infrastructure/bible/bible-json-source.ts`. Le prompt §3 laisse le choix
> ("SQLite **ou** la représentation locale finalement retenue par l'architecture
> VersyFlow") ; l'architecture retenue est le JSON embarqué, pas un moteur SQLite
> reconstruit à zéro. Les formats sources (USFM/USFX/…) ne sont jamais embarqués.

---

# 3. CE QUI NE DOIT PAS ÊTRE EMBARQUÉ

Même si toutes les traductions sont embarquées, **tous les formats sources ne doivent pas être conservés dans l'application runtime**.

Les formats comme :

```text
USFM
USFX
OSIS
Zefania XML
EPUB
HTML
SWORD
TXT
```

servent principalement au pipeline de constitution et de validation du corpus.

Le produit final doit utiliser une représentation runtime optimisée, principalement :

```text
SQLite
```

ou la représentation locale finalement retenue par l'architecture VersyFlow.

Donc :

```text
RAW SOURCES
    ↓
INGESTION
    ↓
NORMALIZATION
    ↓
VALIDATION
    ↓
RUNTIME DATASET
    ↓
JSON EMBARQUÉ (VersyFlow)
    ↓
APPLICATION
```

---

# 4. RÈGLE ABSOLUE — NE JAMAIS TRAITER LES BIBLES UNE PAR UNE

INTERDICTION DE faire :

```text
LSG
→ corriger
→ tester
→ bricoler
→ recommencer

Ostervald
→ corriger
→ tester
→ bricoler
→ recommencer

Darby
→ corriger
→ ...
```

Cette stratégie a déjà provoqué une dérive massive de contexte.

La session précédente montre une succession de corrections spécifiques du parseur LSG, de regex, de scripts de trace et de scripts de réparation, sans obtenir un moteur générique stable.

Le système doit au contraire faire :

```text
REGISTRY
    ↓
BATCH ORCHESTRATOR
    ↓
FORMAT DETECTOR
    ↓
FORMAT ADAPTER
    ↓
COMMON MODEL
    ↓
NORMALIZER
    ↓
VALIDATOR
    ↓
RUNTIME DATASET (JSON embarqué)
    ↓
ALL REGISTERED DATASETS
```

Une seule correction du moteur doit bénéficier à toutes les traductions compatibles.

---

# 5. PREMIÈRE RESPONSABILITÉ — AUDITER LE DÉPÔT

Avant d'écrire du nouveau code :

auditer le dépôt complet.

Identifier précisément :

## Bible data déjà présentes

- dossiers ;
- fichiers ;
- traductions ;
- langues ;
- formats ;
- doublons ;
- datasets incomplets ;
- fichiers temporaires ;
- fichiers générés ;
- datasets valides ;
- datasets invalides.

## Code déjà présent

- parser(s) ;
- importers ;
- normalizers ;
- registry ;
- scripts ;
- types ;
- repositories ;
- services ;
- SQLite ;
- migrations ;
- tests ;
- UI Bible ;
- search ;
- translation comparison.

## Documentation

- spécifications ;
- rapports ;
- notes ;
- manifests ;
- anciens plans ;
- décisions obsolètes.

---

# 6. TROIS CATÉGORIES À ÉTABLIR

Après l'audit, créer une matrice :

```text
KEEP
REWORK
DELETE
```

## KEEP

Code ou données déjà valides.

## REWORK

Code utile mais construit avec une mauvaise stratégie.

## DELETE

Code :

- temporaire ;
- expérimental ;
- redondant ;
- cassé ;
- spécifique inutilement à une traduction ;
- créé seulement pour debugger un problème provisoire.

Les fichiers de debug temporaires de la session précédente doivent particulièrement être examinés et supprimés s'ils n'ont plus de rôle.

Exemples observés :

```text
trace-psa3.mjs
debug-bs.mjs
debug-bs2.mjs
debug-bs3.mjs
probe-bs.mjs
trace-psa3b.mjs
fix-star-rev.mjs
fix-all.mjs
```

Ne conserve pas des scripts de diagnostic uniquement parce qu'ils ont été créés pendant une tentative ratée.

---

# 7. AUDIT DES DATASETS DÉJÀ TÉLÉCHARGÉS

Créer un inventaire :

```text
docs/bible/CURRENT_DATASET_INVENTORY.md
```

Pour chaque dataset :

```text
translationId
language
source
format
path
size
license
status
completeness
canon
versification
downloaded?
validated?
normalized?
sqlite?
```

Le dataset LSG déjà présent doit être enregistré comme dataset existant, pas retéléchargé inutilement.

La session confirme actuellement :

```text
data/bible/raw/fra/fraLSG_usfm
```

avec les 66 livres et environ 31 170 versets bruts extraits par l'outil existant.

Mais cette extraction n'est pas encore considérée comme validée.

> **NOTE D'AUDIT (VersyFlow)** : le comptable de référence pour un dataset
> PROTESTANT_66 valide est **17 380 versets** (canon 66 livres). Le chiffre
> "31 170" observé correspond probablement à une double-comptage ou à un
> ensemble non canon ; il doit être vérifié, pas admis. LSG embarqué
> (`data/bible/lsg.json`) = 17 380 versets, 66 livres → VALIDÉ.

---

# 8. SOURCE DE VÉRITÉ DU CORPUS

Créer :

```text
src/domains/bible/data/
```

ou utiliser la structure existante si elle est meilleure.

Le registre doit devenir la source de vérité.

Créer ou refondre :

```text
BibleDatasetRegistry
```

Le registre doit connaître :

```text
Language
Translation
Edition
Dataset
Format
Source
License
Canon
Versification
Script
Direction
Completeness
Expected counts
Download URL
Checksum
Validation status
Runtime status
```

> **NOTE D'AUDIT (VersyFlow)** : le registre de traduction existe déjà dans
> `src/domains/bible/registry.ts` (`BibleTranslationRegistry`, catalogue pur,
> port-based). Il connaît `language`, `license`, `versification`, `direction`,
> `format`, `available`. Il ne connaît pas encore `checksum`, `canon`,
> `completeness`, `expected counts` ni les `dataset` (raw/normalized/runtime
> paths). Le plan enrichit ce registre, il ne le remplace pas.

---

# 9. MODÈLE HIÉRARCHIQUE

Le modèle obligatoire est :

```text
LANGUAGE
    ↓
TRANSLATION
    ↓
EDITION
    ↓
DATASET
    ↓
CANON
    ↓
VERSIFICATION
    ↓
BOOK
    ↓
CHAPTER
    ↓
VERSE
```

NE PAS utiliser :

```text
FrenchBible
EnglishBible
ArabicBible
```

comme concepts fondamentaux.

---

# 10. LANGUAGE

Chaque langue doit posséder :

```json
{
  "id": "fra",
  "iso6393": "fra",
  "name": "French",
  "nativeName": "Français",
  "locale": "fr",
  "script": "Latn",
  "direction": "ltr"
}
```

Pour l'arabe :

```text
script = Arab
direction = rtl
```

Pour l'hébreu :

```text
script = Hebr
direction = rtl
```

Pour le chinois :

```text
script = Hans / Hant
direction = ltr
```

---

# 11. TRANSLATION

Chaque traduction possède un identifiant stable.

Exemple :

```text
fra-lsg-1910
fra-ostervald
fra-darby
fra-neo-crampon
eng-web
eng-web-updated
eng-asv-1901
spa-rvr1909
```

Une même langue peut avoir autant de traductions que le registre en autorise.

> **NOTE D'AUDIT (VersyFlow)** : les identifiants stables du corpus VersyFlow
> suivent la forme `fra-lsg-1910`, `eng-web`, etc. L'app existante utilise des
> ids courts (`lsg`, `ostervald`, `kujv`, `darby`) dans `registry.ts`. Le moteur
> d'ingestion doit produire des ids du registre ; la migration des ids courts
> vers les ids stables se fait au niveau du registre, pas dans le moteur.

---

# 12. DATASET

Le dataset est l'objet réellement ingéré.

Il doit contenir :

```text
translationId
sourceEdition
sourceFormat
sourceProvider
sourceUrl
downloadUrl
checksum
license
canon
versification
completeness
rawPath
normalizedPath
sqlitePath
```

> **NOTE (VersyFlow)** : `sqlitePath` est remplacé par `runtimePath` (chemin du
> dataset JSON embarqué) — le runtime est du JSON, pas du SQLite (voir §2).

---

# 13. STATUTS

Utiliser strictement :

```text
VERIFIED_FREE
VERIFIED_OPEN
JURISDICTION_LIMITED
LEGAL_REVIEW_REQUIRED
LICENSE_REQUIRED
REJECTED
```

---

# 14. REGLE JURIDIQUE

Une traduction accessible gratuitement sur Internet n'est PAS automatiquement librement redistribuable.

Une traduction ne doit entrer dans le corpus distribué que si :

```text
VERIFIED_FREE
```

ou :

```text
VERIFIED_OPEN
```

avec licence compatible.

Les traductions protégées restent documentées mais ne doivent pas être copiées dans le corpus.

---

# 15. REGISTRE DES TRADUCTIONS NON UTILISABLES

Créer :

```text
docs/bible/EXCLUDED_TRANSLATIONS.md
```

Par exemple :

```text
Parole de Vie 2017
Bible du Semeur 2015
Segond 21
TOB
```

lorsque la licence de redistribution n'est pas libre.

Conserver :

```text
name
source
license evidence
reason
```

sans intégrer le texte.

---

# 16. SOURCES WEB PRINCIPALES

La source mondiale prioritaire est eBible.org.

Utiliser :

### Bible search / catalogue

https://ebible.org/find/

### Copyright / licences

https://ebible.org/Scriptures/copyright.php

### File directory

https://ebible.org/Scriptures/dir.php

### Certified Bibles

https://ebible.org/certified/

La page « certified » est particulièrement importante : eBible indique que ces Bibles ont subi des contrôles de qualité, que le statut de copyright est documenté et que les fichiers librement redistribuables sont accompagnés de hashes SHA-256/signatures.

---

# 17. RÈGLE IMPORTANTE SUR LES LIENS

Le registre doit contenir les **URL EXACTES** utilisées.

Ne pas enregistrer seulement :

```text
eBible.org
```

mais :

```text
sourcePage
downloadPage
directDownloadUrl
licenseUrl
```

Pour chaque fichier téléchargé :

```json
{
  "filename": "",
  "url": "",
  "sha256": "",
  "sizeBytes": ""
}
```

Ainsi, toute personne ou tout agent futur peut refaire l'ingestion sans recherche manuelle.

---

# 18. FRANÇAIS — DATASETS ACTUELS

## FR-001 — Louis Segond 1910

```text
translationId: fra-lsg-1910
code: fraLSG
license: Public Domain
status: VERIFIED_FREE
```

Source :

https://ebible.org/bible/details.php?id=fraLSG

La fiche eBible confirme le domaine public et expose les formats de téléchargement.

Source file directory :

https://ebible.org/Scriptures/dir.php

Formats à rechercher :

```text
fraLSG_usfm.zip
fraLSG_usfx.zip
fraLSG_vpl.zip
fraLSG_html.zip
fraLSG_readaloud.zip
fraLSG1910eb.zip
```

Le fichier USFM doit être privilégié pour l'ingestion structurée si disponible.

## FR-002 — Ostervald

```text
translationId: fra-ostervald
code: fra_fob
license: Public Domain
status: VERIFIED_FREE
```

Page eBible :

https://ebible.org/find/details.php?id=fra_fob

Répertoire fichiers :

https://ebible.org/Scriptures/dir.php

Rechercher :

```text
fraFOB1744eb.zip
fra_fob_usfm.zip
fra_fob_usfx.zip
fra_fob_vpl.zip
fra_fob_html.zip
fra_fob_readaloud.zip
```

La version eBible est répertoriée comme domaine public dans le catalogue actuel.

## FR-003 — Bible J.N. Darby

```text
translationId: fra-darby
code: frajnd
license: Public Domain
status: VERIFIED_FREE
```

Page :

https://ebible.org/find/details.php?id=frajnd

Rechercher :

```text
frajnd_usfm.zip
frajnd_usfx.zip
frajnd_vpl.zip
frajnd_html.zip
frajnd2024eb.zip
```

Attention à sa versification/édition propre.

## FR-004 — Sainte Bible néo-Crampon Libre

```text
translationId: fra-neo-crampon-libre
code: francl
license: CC BY-SA 4.0
status: VERIFIED_OPEN
```

Page :

https://ebible.org/details.php?id=francl

Répertoire :

https://ebible.org/Scriptures/dir.php

Fichiers :

```text
francl_usfm.zip
francl_usfx.zip
francl_vpl.zip
francl_html.zip
francl_readaloud.zip
```

La licence et les fichiers sont disponibles dans le catalogue eBible actuel.

## FR-005 — Sainte Bible libre pour le monde

Une nouvelle entrée doit être ajoutée :

```text
translationId: fra-free-world
code: frasbl
year: 2022
status: VERIFIED_FREE
license: Public Domain
```

eBible la répertorie actuellement comme :

```text
French Free Holy Bible for the World
2022
Public Domain
code frasbl
```

Page à résoudre :

https://ebible.org/find/details.php?id=frasbl

Fichiers visibles dans le répertoire actuel :

```text
frasbl_usfm.zip
frasbl_usfx.zip
frasbl_vpl.zip
frasbl_html.zip
frasbl_readaloud.zip
```

Le répertoire eBible expose actuellement ces fichiers et leurs tailles.

---

# 23. FRANÇAIS — TRADUCTIONS À NE PAS INGÉRER

## Parole de Vie 2017 / Français facile

Le nom peut apparaître comme :

```text
Parole de Vie
Bible en Français Facile
PDV
```

Mais ces appellations ne signifient pas licence libre.

Ne pas intégrer tant qu'une autorisation appropriée n'est pas démontrée.

Statut :

```text
LICENSE_REQUIRED
```

## Bible du Semeur

```text
BDS / Bible du Semeur 2015
```

Statut :

```text
LICENSE_REQUIRED
```

Ne jamais télécharger depuis GitHub ou autre dépôt uniquement pour contourner le copyright.

---

# 24. RECHERCHE FRANÇAISE SUPPLÉMENTAIRE

Avant de clore le français :

rechercher sur eBible, CrossWire et projets de traduction ouverte :

```text
Français Facile
Parole de Vie
Bible en français courant
Bible simple
Bible accessible
Bible fondamentale
Semeur
TOB
Segond
Martin
Darby
Ostervald
Crampon
```

Pour chaque découverte :

```text
LICENSE
SOURCE
FORMAT
COMPLETENESS
YEAR
STATUS
```

Aucun dataset ne doit être ajouté à la distribution uniquement parce qu'un fichier existe publiquement.

---

# 25. ENGLISH — WEB CLASSIC

```text
translationId: eng-web
code: eng-web
status: VERIFIED_FREE
license: Public Domain
```

Page :

https://ebible.org/bible/details.php?id=eng-web

La fiche eBible indique explicitement `public domain`.

Formats actuels visibles :

```text
eng-web_html.zip
eng-web.epub
eng-web_readaloud.zip
eng-web_word.zip
engweb2025eb.zip
```

Pour l'ingestion structurée, rechercher les formats développeur sur la fiche/répertoire.

---

# 26. ENGLISH — WEB UPDATED

```text
translationId: eng-web-updated
code: engwebu
status: VERIFIED_FREE
license: Public Domain
```

Page licence :

https://ebible.org/engwebu/copyright.htm

La licence permet explicitement la copie, redistribution et adaptation sous la règle de dénomination.

Formats PDF existants mais NON prioritaires pour ingestion :

https://ebible.org/pdf/engwebu/

Pour le corpus runtime rechercher plutôt :

```text
USFM
USFX
VPL
OSIS
```

---

# 27. ENGLISH — WEB CATHOLIC

```text
translationId: eng-web-c
status: VERIFIED_FREE
license: Public Domain
```

Page :

https://ebible.org/eng-web-c/copyright.htm

eBible confirme explicitement le domaine public.

Cette version ne doit pas être fusionnée avec WEB Classic.

---

# 28. ENGLISH — WEB BRITISH EDITION

```text
translationId: eng-webbe
code: eng-webbe
status: VERIFIED_FREE
license: Public Domain
```

Page :

https://ebible.org/bible/details.php?id=eng-webbe

Fichier CrossWire actuel :

```text
engwebbe2025eb.zip
```

La page indique Public Domain.

---

# 29. ENGLISH — AMERICAN STANDARD VERSION

Rechercher et ingérer :

```text
eng-asv
American Standard Version 1901
```

Status :

```text
VERIFIED_FREE
```

Source principale :

https://ebible.org/

---

# 30. ENGLISH — BIBLE IN BASIC ENGLISH

```text
engBBE
Bible in Basic English
```

Statut :

```text
VERIFIED_FREE
```

Source :

https://ebible.org/

Rechercher les formats développeur.

---

# 31. ENGLISH — YOUNG'S LITERAL TRANSLATION

```text
engylt
Young's Literal Translation
```

Statut :

```text
VERIFIED_FREE
```

Source :

https://ebible.org/

---

# 32. ENGLISH — WEBSTER

```text
engwebster
Webster's Bible
```

Statut :

```text
VERIFIED_FREE
```

Source :

https://ebible.org/

---

# 33. ENGLISH — REVISED VERSION

```text
eng-rv
Revised Version
```

Statut :

```text
VERIFIED_FREE
```

Mais enregistrer correctement :

```text
canon
deuterocanon
versification
```

Ne pas supposer que son canon est identique à WEB.

---

# 34. ENGLISH — GENEVA

```text
eng-geneva-1599
1599 Geneva Bible
```

Rechercher la fiche eBible correspondant exactement à cette édition.

Statut attendu :

```text
VERIFIED_FREE
```

Ne pas confondre différentes éditions de la Geneva Bible.

---

# 35. ENGLISH — DARBY

```text
eng-darby
Darby Translation
```

Rechercher le code eBible exact puis télécharger les formats structurés.

---

# 36. ENGLISH — WORLD MESSIANIC BIBLE

```text
engwmb
World Messianic Bible
```

Statut :

```text
VERIFIED_FREE
```

Page :

https://ebible.org/engwmb/copyright.htm

La source confirme le statut Public Domain.

---

# 37. ENGLISH — WORLD MESSIANIC BRITISH

Rechercher :

```text
engwmbb
```

Télécharger la variante complète si elle est déclarée redistribuable.

---

# 38. ENGLISH — RECHERCHE SUPPLÉMENTAIRE

Ne pas arrêter l'anglais aux versions ci-dessus.

Utiliser la page eBible :

https://ebible.org/find/

et le catalogue copyright :

https://ebible.org/Scriptures/copyright.php

Filtrer toutes les entrées :

```text
language = English
license = Public Domain
ou
license = Creative Commons compatible
```

Créer automatiquement le registre complet.

---

# 39. AUTRES LANGUES — LISTE DE PRIORITÉ

Après français et anglais :

```text
Spanish
Portuguese
German
Russian
Ukrainian
Italian
Arabic
Chinese
Korean
Japanese
Persian
Tagalog
Swahili
Dutch
Indonesian
Hindi
Malayalam
Norwegian
Swedish
Danish
Finnish
Icelandic
Somali
Latin
Greek
Hebrew
```

Puis toutes les autres langues éligibles découvertes.

---

# 40. IMPORTANT — NE PAS ARRÊTER À UNE SEULE TRADUCTION PAR LANGUE

Pour chaque langue :

```text
chercher toutes les traductions redistribuables
```

et non :

```text
trouver une Bible
→ arrêter
```

Exemple :

```text
French
├── LSG
├── Ostervald
├── Darby
├── Néo-Crampon
└── Sainte Bible libre pour le monde
```

Même logique pour English, Spanish, German, etc.

---

# 41. CATALOGUE AUTOMATIQUE PAR LANGUE

Créer :

```text
docs/bible/catalog/
```

avec un fichier par langue :

```text
fra.json
eng.json
spa.json
por.json
deu.json
rus.json
ukr.json
ita.json
ara.json
zho.json
kor.json
jpn.json
fas.json
tgl.json
swa.json
...
```

Chaque fichier liste toutes les traductions utilisables.

> **DÉCISION LOCALE (VersyFlow, session 2026-09-12)** : la discovery eBible est
> faite **en direct** (WebFetch/WebSearch sur ebible.org) et non par liste
> manuelle. Le moteur d'ingestion reste centralisé ; les catalogues générés
> alimentent le registre, ils ne créent jamais de parseur dédié.

---

# 42. CATALOGUE GLOBAL

Créer :

```text
docs/bible/BIBLE_TRANSLATION_CATALOG.json
```

Il doit contenir toutes les traductions.

Structure :

```json
{
  "languages": [],
  "translations": [],
  "datasets": []
}
```

---

# 43. LIENS DIRECTS

Chaque entrée du catalogue doit contenir :

```json
{
  "sourcePage": "",
  "licensePage": "",
  "downloadPage": "",
  "files": [
    {
      "name": "",
      "url": "",
      "format": "",
      "sizeBytes": ""
    }
  ]
}
```

Ainsi l'agent ne devra jamais rechercher manuellement le même fichier une deuxième fois.

---

# 44. NE PAS CONSTRUIRE UNE LISTE MANUELLE INFINIE

Tu dois distinguer :

### Seed registry

Les traductions explicitement définies dans ce prompt.

### Discovery engine

L'agent doit également découvrir automatiquement toutes les traductions éligibles des langues prioritaires via les catalogues officiels.

Le résultat doit être fusionné.

Cela permet à VersyFlow de suivre l'évolution des projets bibliques ouverts.

---

# 45. INGESTION ENGINE GÉNÉRIQUE

Construire :

```text
BibleIngestionOrchestrator
```

Responsabilités :

```text
read registry
→ resolve source
→ download
→ identify format
→ select adapter
→ parse
→ normalize
→ validate
→ build runtime dataset (JSON)
→ checksum
→ register
→ report
```

---

# 46. FORMAT ADAPTERS

Créer une architecture :

```text
BibleFormatAdapter
```

avec des implémentations :

```text
USFMAdapter
USFXAdapter
OSISAdapter
ZefaniaAdapter
VPLAdapter
JSONAdapter
```

N'ajouter une nouvelle branche que lorsqu'un format réellement nouveau l'exige.

> **DÉCISION LOCALE (VersyFlow)** : USFMAdapter est le format prioritaire
> (tous les datasets eBible retenus disposent d'USFM). Les autres adapters
> (USFX, OSIS, Zefania, VPL, JSON) sont des points d'extensibilité **lazy** —
> on ne les implémente que quand un dataset réel exige ce format. Interdiction
> de micro-gérer (créer parser-lsg, parser-web, etc.).

---

# 47. CANONICAL MODEL

Tous les adapters doivent produire le même modèle intermédiaire :

```text
BibleDocument
  books[]
    chapters[]
      verses[]
```

Chaque verse doit au minimum contenir :

```text
bookId
chapter
verse
text
```

Les métadonnées supplémentaires sont conservées lorsque pertinentes.

---

# 48. NE PAS NETTOYER LE TEXTE PAR UNE LONGUE LISTE DE REGEX AD HOC

L'approche précédente a montré ses limites.

Ne construis pas un pipeline du type :

```text
regex1
regex2
regex3
...
regex40
```

pour chaque traduction.

Le parser doit comprendre la structure du format.

Le nettoyage doit intervenir après l'analyse structurelle.

---

# 49. USFM

Pour USFM :

1. parser les marqueurs structuraux ;
2. identifier livre ;
3. identifier chapitre ;
4. identifier verset ;
5. identifier les blocs ;
6. conserver le texte ;
7. exclure les métadonnées non destinées au texte de mémorisation ;
8. produire le modèle canonique.

Les marqueurs USFM doivent être gérés au niveau du parser USFM, pas comme une succession de rustines.

---

# 50. TEST DU PARSER

Le parser doit être testé sur plusieurs styles USFM avant ingestion massive :

```text
LSG
Ostervald
Darby
WEB
RVR1909
```

Le test de réussite est :

```text
UN MÊME ADAPTER
→ plusieurs traductions
```

---

# 51. TEST PAR FORMAT

Créer des fixtures :

```text
tests/fixtures/bible/usfm/
tests/fixtures/bible/usfx/
tests/fixtures/bible/osis/
tests/fixtures/bible/zefania/
tests/fixtures/bible/vpl/
```

Chaque fixture doit couvrir :

```text
book
chapter
verse
footnote
cross-reference
poetry
paragraph
word markup
heading
special characters
```

---

# 52. VALIDATION CORPUS

Pour chaque traduction :

```text
book count
chapter count
verse count
missing verses
duplicate verses
duplicate references
empty verses
malformed references
Unicode errors
```

Le validator doit produire un rapport.

---

# 53. COMPLETENESS

Chaque dataset doit indiquer :

```text
FULL_BIBLE
OLD_TESTAMENT
NEW_TESTAMENT
PORTIONS
FRAGMENT
DRAFT
```

Ne jamais présenter une portion comme une Bible complète.

---

# 54. CANON

Chaque dataset doit déclarer :

```text
PROTESTANT_66
CATHOLIC
ORTHODOX
FULL_ECUMENICAL
HEBREW_BIBLE
NEW_TESTAMENT
OTHER
```

Ne jamais déduire le canon uniquement du nombre de livres.

---

# 55. VERSIFICATION

Chaque dataset doit déclarer :

```text
versificationId
```

et si nécessaire :

```text
verseMapping
```

Le moteur de contenu ne doit pas supposer que deux traductions utilisent exactement le même découpage.

---

# 56. SQLITE

Le résultat runtime de chaque traduction doit être une base SQLite optimisée.

Elle doit contenir uniquement ce que l'application nécessite.

Structure de départ à adapter à l'architecture existante :

```text
translations
books
chapters
verses
verse_mappings
tokens
```

Ne pas reconstruire une nouvelle architecture SQLite si une architecture correcte existe déjà dans le projet.

> **DÉCISION LOCALE (VersyFlow, session 2026-09-12)** : le runtime embarqué est
> le **JSON**, pas le SQLite. L'architecture JSON embarquée existante
> (`repository-local.ts` + `bible-json-source.ts`) est considérée comme correcte
> et non reconstruite. Le dataset runtime par traduction est un fichier
> `data/bible/{translation-id}.json`.

---

# 57. BIBLE BUNDLE FINAL

Tous les datasets finaux doivent pouvoir être regroupés dans le package final de l'application.

Exemple :

```text
data/bible/
  registry.json
  lsg.json
  ostervald.json
  darby.json
  fra-neo-crampon.json
  web.json
  web-updated.json
  ...
```

Le chemin réel doit suivre l'architecture du dépôt existant.

> **NOTE D'AUDIT (VersyFlow)** : le bundle réel est `data/bible/{id}.json`
> (pas `assets/bible/`). Le loader web `BibleJsonFileSource` fetch
> `data/bible/{id}.json`. Le dataset LSG embarqué est `data/bible/lsg.json`.

---

# 58. PAS DE DOWNLOAD USER

Aucune fonctionnalité UI ne doit être conçue pour :

```text
Download Translation
Install Translation
Delete Translation
```

Les traductions sont des ressources embarquées.

L'interface permet simplement :

```text
Select language
Select translation
Compare translations
```

---

# 59. BIBLE SEARCH

Toutes les recherches doivent fonctionner localement.

Pas besoin d'API externe pour :

```text
reference lookup
book search
verse lookup
passage lookup
text search
translation comparison
```

---

# 60. TRANSLATION COMPARISON

Le système doit pouvoir charger simultanément :

```text
same reference
+
multiple local datasets
```

Exemple :

```text
Jean 3:16
LSG
Ostervald
Darby
Néo-Crampon
```

sans requête réseau.

---

# 61. BATCH BUILD

Créer une seule commande ou orchestration équivalente :

```bash
npm run bible:build
```

ou un mécanisme mieux adapté au projet.

Elle doit :

```text
1. lire registry
2. détecter datasets manquants
3. télécharger sources
4. vérifier checksums
5. détecter formats
6. parser
7. normaliser
8. valider
9. générer le dataset runtime (JSON)
10. générer manifests
11. générer checksum
12. générer rapport
```

---

# 62. REBUILD INCREMENTAL

La commande doit être intelligente.

Si :

```text
source inchangée
+
parser inchangé
+
manifest inchangé
```

ne pas reconstruire inutilement.

Si le parser change :

reconstruire les datasets concernés.

---

# 63. MULTI-WORKFLOW

Pour accélérer :

tu peux paralléliser les opérations indépendantes :

```text
Workflow A — French
Workflow B — English
Workflow C — Spanish/Portuguese
Workflow D — Russian/Ukrainian/German
Workflow E — Asian/Middle-Eastern languages
```

MAIS :

**tous les workflows utilisent le même ingestion engine.**

Ils ne doivent jamais créer chacun leur propre parser.

---

# 64. RÈGLE DE CONCURRENCE

Ne lance pas cinq agents pour chacun bricoler son propre parseur.

La parallélisation concerne :

```text
DATASETS
```

pas :

```text
ARCHITECTURE
```

L'architecture du moteur doit rester centralisée.

---

# 65. CHECKSUMS

Calculer SHA-256 pour :

```text
raw source
normalized dataset
runtime dataset (JSON)
```

Conserver les hashes dans les manifests.

---

# 66. RAPPORT DE BUILD

Chaque build doit générer :

```text
docs/bible/reports/
```

avec :

```text
build-summary.md
validation-summary.json
dataset-status.json
```

Le rapport doit préciser :

```text
successful
failed
skipped
rejected
```

---

# 67. ÉCHEC D'UNE TRADUCTION

Si une traduction échoue :

```text
NE PAS CASSER LE BUILD GLOBAL
```

Le système doit produire :

```text
dataset FAILED
```

et continuer avec les autres datasets lorsque possible.

Puis fournir :

```text
failure reason
dataset
file
format
parser
line/reference
```

---

# 68. NE PAS BLOQUER LE PROJET SUR UN SEUL DATASET

Une erreur dans :

```text
LSG
```

ne doit pas empêcher :

```text
WEB
RVR1909
Ostervald
...
```

d'être construits si leur pipeline fonctionne.

---

# 69. QUALITÉ

Une traduction ne devient `READY` que lorsque :

```text
source verified
+
license verified
+
downloaded
+
parsed
+
validated
+
normalized
+
runtime dataset generated
+
tests passed
```

---

# 70. RAPPORT FINAL ATTENDU

Créer :

```text
docs/bible/BIBLE_CORPUS_STATUS.md
```

avec un tableau :

| Language | Translation | License | Source | Raw | Parsed | SQLite | Tests | Status |
| -------- | ----------- | ------- | ------ | --- | ------ | ------ | ----- | ------ |

> **NOTE (VersyFlow)** : la colonne « SQLite » devient « Runtime » (JSON embarqué).

---

# 71. PLANIFICATION AVANT IMPLÉMENTATION

APRÈS avoir :

```text
lu ce prompt
+
sauvegardé ce prompt
+
audité le dépôt
```

tu dois créer :

```text
docs/bible/BIBLE_CORPUS_IMPLEMENTATION_PLAN.md
```

Ce plan doit répondre à :

### Ce qui existe

### Ce qui fonctionne

### Ce qui est incorrect

### Ce qui doit être supprimé

### Ce qui doit être refactoré

### Ce qui doit être construit

### Traductions déjà téléchargées

### Traductions manquantes

### Traductions exclues

### Formats supportés

### Formats manquants

### Architecture cible

### Ordre d'implémentation

---

# 72. NE PAS COMMENCER L'IMPLÉMENTATION AVANT LE PLAN

Tu dois d'abord :

```text
AUDIT
→ PLAN
→ REVIEW DU PLAN
→ IMPLEMENTATION
```

Pas :

```text
AUDIT
→ CODER IMMEDIATEMENT
```

---

# 73. PREMIÈRE TÂCHE APRÈS LE PLAN

La première tâche ne doit PAS être :

```text
fix LSG
```

La première tâche doit être :

```text
build Universal Bible Ingestion Core
```

si l'audit confirme que cette couche est insuffisante.

---

# 74. DEFINITION OF DONE — INGESTION ENGINE

Le moteur est considéré opérationnel lorsqu'il peut ingérer au minimum :

```text
LSG
Ostervald
Darby
Néo-Crampon
WEB
WEB Updated
RVR1909
```

avec le même pipeline générique.

Aucune modification spécifique au texte de LSG ne doit être nécessaire pour traiter WEB ou RVR1909.

---

# 75. DEFINITION OF DONE — CORPUS

Le corpus est terminé lorsque :

```text
ALL REGISTERED DATASETS
+
LICENSE VERIFIED
+
SOURCE VERIFIED
+
DOWNLOAD VERIFIED
+
FORMAT PARSED
+
TEXT VALIDATED
+
CANON IDENTIFIED
+
VERSIFICATION IDENTIFIED
+
RUNTIME DATASET GENERATED
+
CHECKSUM GENERATED
+
REGISTRY COMPLETE
+
BUILD BATCH SUCCESSFUL
+
WEB APP CAN ACCESS THE LOCAL DATA
```

---

# 76. TEST ULTIME DE L'ARCHITECTURE

Après la construction du moteur :

ajouter une nouvelle traduction compatible USFM au registry.

Le système doit pouvoir :

```text
detect
download
parse
normalize
validate
runtime dataset
register
```

sans modifier :

```text
Bible domain core
Memory Engine
FSRS
Comparison Engine
UI
routes
```

Si cela nécessite du code spécifique à cette traduction :

```text
ARCHITECTURE REJECTED
```

et le moteur doit être corrigé.

---

# 77. RAPPORT D'EXÉCUTION

À la fin de chaque lot :

```text
DONE
```

uniquement si réellement terminé.

Sinon :

```text
IN_PROGRESS
BLOCKED
FAILED
```

Ne jamais déclarer une feature « terminée » simplement parce qu'une commande a produit un fichier.

---

# 78. UTILISATION DU TEMPS ET DES TOKENS

IMPORTANT :

Tu dois optimiser le travail.

Ne pas passer de longues périodes à :

```text
patch regex
→ debug
→ patch regex
→ debug
```

Si un problème révèle que l'architecture du parser est incorrecte :

```text
STOP
RETURN TO ARCHITECTURE
FIX GENERIC MECHANISM
```

Puis reprendre le batch.

Tu dois privilégier :

```text
1 correct generic solution
```

à :

```text
20 translation-specific fixes
```

---

# 79. INTERDICTION DE MICRO-GÉRER LES FICHIERS

Ne crée pas manuellement :

```text
translation1.ts
translation2.ts
translation3.ts
```

Ne crée pas :

```text
parser-lsg
parser-ostervald
parser-web
```

si leurs formats sont identiques.

Créer :

```text
USFMAdapter
```

et le réutiliser.

---

# 80. FINAL — ORDRE STRICT

Tu dois suivre cet ordre :

```text
1. READ ENTIRE PROMPT
2. SAVE PROMPT
3. AUDIT REPOSITORY
4. INVENTORY CURRENT BIBLE DATA
5. IDENTIFY WHAT EXISTS
6. IDENTIFY WHAT MUST BE KEPT
7. IDENTIFY WHAT MUST BE REMOVED
8. IDENTIFY WHAT MUST BE REWORKED
9. IDENTIFY WHAT MUST BE BUILT
10. INVENTORY DOWNLOADED TRANSLATIONS
11. INVENTORY MISSING TRANSLATIONS
12. BUILD GLOBAL TRANSLATION REGISTRY
13. RESOLVE ALL SOURCE/LICENSE/DOWNLOAD URLS
14. BUILD UNIVERSAL INGESTION ENGINE
15. TEST GENERIC PARSERS
16. RUN BATCH INGESTION
17. VALIDATE ALL DATASETS
18. GENERATE RUNTIME DATASETS
19. GENERATE GLOBAL REPORT
20. INTEGRATE WITH VERSYFLOW
21. TEST WEB APPLICATION
```

NE PAS inverser cet ordre.

---

# 81. OBJECTIF FINAL

Le résultat recherché n'est pas :

```text
LSG fonctionne.
```

Le résultat recherché est :

```text
VERSYFLOW POSSEDE UN SYSTÈME UNIVERSEL
QUI SAIT ABSORBER UN CORPUS BIBLIQUE MONDIAL
DE MANIÈRE AUTOMATIQUE,
STRUCTURÉE,
VÉRIFIABLE,
OFFLINE-FIRST,
MULTI-LANGUE,
MULTI-TRADUCTION,
ET INDÉPENDANTE DU MOTEUR DE MÉMORISATION.
```

Le principe fondamental est :

```text
UNE NOUVELLE BIBLE
≠
UNE NOUVELLE FEATURE
```

Une nouvelle Bible est :

```text
UN NOUVEAU DATASET
```

et le système doit savoir l'ingérer automatiquement.

---

# DÉCISIONS LOCALES VERSYFLOW (session 2026-09-12)

Consulter avant toute implémentation. Ces décisions résument le prompt aux
choix d'architecture effectivement faits dans ce dépôt :

| N° | Décision | Détail |
|----|----------|--------|
| D1 | Runtime = JSON embarqué | Pas de moteur SQLite reconstruit. `data/bible/{id}.json`. Loader existant : `bible-json-source.ts`. |
| D2 | USFMAdapter = format pivot | Tous les datasets eBible retenus fournissent de l'USFM. Les autres adapters (USFX, OSIS, Zefania, VPL, JSON) sont implémentés à la demande, pas pré-coordonnés. |
| D3 | Discovery eBible en direct | Les catalogues sont générés par WebFetch/WebSearch sur ebible.org, pas par liste manuelle. |
| D4 | Interdiction de bricolage regex | Le moteur d'ingestion générique (USFMAdapter) remplace `scripts/bible/usfm2json.mjs` (LSG-spécifique, bug dupliqué de `parseUsfmDir`). Le parser est écrit une fois, testé sur 5 traductions. |
| D5 | Comptable de référence 17 380 versets | Canon PROTESTANT_66 = 17 380 versets. L'ancien comptable de 31 170 est suspect. Le validator compare les datasets au comptable canonique. |
| D6 | Registry = `src/domains/bible/registry.ts` enrichi | On enrichit `BibleTranslationManifest` (canon, completeness, checksum, dataset paths) plutôt que de créer un nouveau registre en parallèle. |
