# Décisions d'architecture et de produit

Chaque arbitrage pris sans consulter, avec sa raison et sa conséquence. Une
décision remplacée garde son entrée et reçoit une mention « remplacée par ».

---

## Chantier 2 — Bible et suppression du backend

### D1. Le backend est supprimé, pas mis en veille

**Contexte.** L'application reposait sur Supabase (auth, Postgres, Storage) et
PowerSync (synchronisation hors ligne). La consigne : 100 % frontend, données
locales derrière une interface `repository`.

**Décision.** Suppression complète : dépendances, imports, configuration,
variables d'environnement, schémas, hooks, adaptateurs, commentaires, docs et
secrets CI. Aucun code « dormant » derrière un drapeau.

**Conséquence.** La fonctionnalité de mémorisation est elle aussi repointée sur
le stockage local (`local-memorization-service.ts`) : elle perd la
synchronisation multi-appareils, pas son fonctionnement. `tests/design/no-cloud-backend.test.ts`
échoue si l'un des deux noms réapparaît dans un fichier suivi, dans les
dépendances ou dans le lockfile.

### D2. Une seule traduction livrée : la LSG 1910

**Contexte.** Le catalogue liste 57 traductions ; le dépôt n'en versionnait
qu'une (6,9 Mo). Les 56 autres n'existaient sous forme de fichiers que dans des
caches de développement.

**Décision.** Une seule traduction est livrée et testée : la LSG 1910, domaine
public. Les autres restent au catalogue avec le segment `sha256:pending` et
l'écran des traductions les marque comme indisponibles. Aucun fichier factice,
aucun « extrait » présenté comme une traduction complète.

**Conséquence.** Les tests qui exigeaient la présence d'`ostervald.json`,
`kujv.json`, `webu.json`, etc. ont été réécrits : le filtre canonique est
désormais testé sur des fixtures qui reproduisent la forme de ces datasets
(66 livres + slots apocryphes), sans dépendre de fichiers absents. Rien n'est
désactivé : la règle testée est la même.

### D3. Chargement paresseux par chapitre, pas par livre

**Contexte.** Le fichier monolithique pèse 6,9 Mo / 31 170 versets. L'import
statique du JSON met plusieurs secondes à parser sur mobile et garde tout le
corpus en mémoire pour afficher un psaume.

**Décision.** Le dataset est projeté en trois niveaux
(`scripts/bible/split-lsg.mjs`, idempotent, vérifié en CI) :

| Niveau | Fichier | Taille | Chargé quand |
|---|---|---|---|
| Structure | `public/data/bible/lsg/index.json` | ~37 Ko | toujours |
| Chapitre | `public/data/bible/lsg/<book>/<n>.json` | ~4 Ko | quand il devient visible |
| Corpus | `data/bible/lsg.json` (source) | 6,9 Mo | recherche plein texte, statistiques, export |

Un fichier par **chapitre** et non par livre : le lecteur affiche un chapitre à
la fois, et le webview mobile ne doit parser que ce qu'il montre. La projection
est versionnée (c'est ce que lit l'application) et `data/bible/lsg.json` reste
la source de vérité ; `npm run build` échoue si les deux divergent.

**Conséquence.** Ouvrir un chapitre coûte deux requêtes locales (index +
chapitre) au lieu d'un parse de 6,9 Mo ; les statistiques d'une traduction se
lisent dans l'index (1 189 chapitres / 31 170 versets) au lieu de parcourir le
corpus. C'est vérifié par `tests/integration/bible-lazy-loading.test.ts`, qui
compte les requêtes.

### D4. Le texte est corrigé par un script, pas à la main

**Contexte.** Le texte importé portait trois défauts systématiques : 43 253
apostrophes d'élision suivies d'une espace (« l' Éternel »), 223 marqueurs USFM
résiduels (`\b`, `\qs`, `\it`, `\pi`), et des guillemets anglais dans les
titres de psaumes.

**Décision.** `scripts/bible/repair-lsg-text.mjs` applique les trois
corrections, de façon idempotente, et `--check` échoue si le fichier dérive.
Le catalogue (`dataset-catalog.json`) est régénéré derrière (le checksum
change).

**Conséquence.** 21 240 versets corrigés. Les tests d'intégrité refusent
désormais toute apostrophe droite, toute apostrophe suivie d'une espace, tout
guillemet anglais et tout antislash dans un verset affiché.

### D5. Les documents historiques sont archivés, pas réécrits

**Contexte.** Plusieurs documents décrivaient le backend (guides de build,
checklist de production, journal de progression, plans d'exécution). Les
réécrire aurait inventé une histoire qui n'a pas eu lieu.

**Décision.** Ils sont déplacés dans `archive/` avec un bandeau « document
historique », et exclus du scan du garde-fou. Les documents vivants (README,
AGENTS, AI_RULES, BUILD-GUIDE) sont mis à jour.

**Conséquence.** Le dépôt ne contient plus aucune mention des services retirés
hors `archive/` ; la trace du passé reste lisible.

### D6. Les artefacts d'agents sont supprimés du dépôt

**Contexte.** `.amazonq/`, `.kiro/` et `graphify-out/` (3 571 fichiers, 40 Mo de
notes d'agents et de graphes générés) n'ont aucun rôle dans la livraison.

**Décision.** Suppression. `graphify-out/` contenait des références au backend
retiré : le garde-fou l'aurait signalé à chaque build.
