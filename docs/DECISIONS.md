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

---

## Chantier 1 — une seule route par écran

### D7. Une ancienne URL redirige, elle ne disparaît pas

**Contexte.** Quatre doublons d'écrans étaient enregistrés dans `src/main.tsx` :
la Bible sur trois URL (`/bible/explorer`, `/bible/book`, `/bible/chapter`
avec ses query params), la mémorisation sur deux flux (`/memory/start` et
`/memorization/*`), les réglages sur deux hubs (`/settings` et
`/tabs/settings`), les profils sur deux sélecteurs (`/profile/select` et
`/family/select-profile`).

**Décision.** L'écran le plus complet devient la destination unique ; l'ancien
chemin reste déclaré et effectue une **redirection** qui conserve la cible
(ex. `/bible/chapter/joh/3` → `/bible/explorer/joh/3`, `/bible/book` →
`/bible/explorer`). Les écrans supprimés (`app/bible/book.tsx`,
`app/bible/chapter.tsx`, `app/family/select-profile.tsx`, `app/memory/start.tsx`)
n'ont pas de remplaçant partiel : leur contenu vivait déjà dans la destination.

**Conséquence.** Aucun lien existant (notes, collections, historique, URL
partagée) ne casse. `/memory/start` devient l'atelier de méthode sous
`/memorization/start`, avec ses coordonnées dans l'URL au lieu d'un `state` de
routeur — il fonctionne donc aussi en navigation profonde.

### D8. Ce qui reste séparé

`memorization/*` et `memory/*` restent deux familles : la première conduit la
session et l'atelier de méthode, la seconde porte les deux exercices ciblés
(`flashcard`, `recall-writing`). Ce ne sont pas deux implémentations du même
écran — c'était le cas avant D7, où `memorization/flashcard.tsx` recopiait
`memory/flashcard.tsx` avec des données en dur.

## Chantier 0 bis — suppressions mesurées

### D9. Cinq fichiers sans importeur sont retirés

**Contexte.** Un scan des imports (`src/` + `app/`, hors tests) listait cinq
modules qu'aucun code n'importait : `useI18n`, `useFamilyInvitation`,
`IonicThemeProvider`, `ionic-variables`, `useColorScheme` (ce dernier était un
doublon du stub de `Primitives.tsx`).

**Décision.** Suppression. Les fichiers **testés** et sans importeur d'exécution
(`demo-auth`, `bible-service`, `useSessionSafety`, `string-utils`, `hash-utils`,
`storage-keys`) sont **conservés** : leurs tests unitaires décrivent un contrat
réel, et supprimer un module pour faire baisser un compteur serait une perte.

**Conséquence.** `src/services/i18n-service.ts` documente désormais qu'il est
l'accès programmatique (stores, services) et que les écrans utilisent
`useTranslation()`.

## Chantier 3 — fiabilité des données

### D10. Le script de projection valide le corpus avant de le projeter

**Contexte.** `split-lsg.mjs` répondait à une seule question : « la copie
est-elle à jour ? ». Un `lsg.json` contenant un verset vide, un livre en double
ou un `chapterCount` faux produisait une projection parfaitement conforme — et
l'application affichait un verset blanc comme si le chargement avait échoué.

**Décision.** La validation est dans le script, exécutée dans les deux modes
(`--check` comme écriture) : livres et chapitres sans doublon, chapitres et
versets contigus à partir de 1, aucun verset vide ou blanchi, aucun caractère
de contrôle ni U+FFFD, `chapterCount` égal au nombre de chapitres. Chaque écart
échoue avec sa référence (`joh/3:16`) et le fichier à corriger.

**Conséquence.** `npm run verify` appelle `split-lsg.mjs --check` (en plus de
`npm run build`, qui le faisait déjà). Le corpus livré passe sans exception :
66 livres, 1 189 chapitres, 31 170 versets, 0 problème. Les tests de la règle
sont dans `tests/unit/bible-corpus-integrity.test.ts`, avec un corpus minimal et
un défaut injecté par cas — pour que le garde-fou ne soit pas seulement une
affirmation.

### D11. Un test vérifie ce que la projection ne regarde pas

**Contexte.** `--check` compare la projection à la source ; il ne dit rien de
l'`index.json` (la structure chargée à l'ouverture) ni de ce que la couche de
lecture sert réellement.

**Décision.** `tests/unit/bible-corpus-integrity.test.ts` lit les fichiers
livrés et vérifie trois égalités : l'index annonce, livre par livre et chapitre
par chapitre, les mêmes compteurs que la source ; chaque chapitre annoncé
existe dans la projection (premier et dernier de chaque livre) ; le corpus
reconstruit par `SplitBibleTextSource` contient la même liste de références que
`data/bible/lsg.json`, dans le même ordre.

**Conséquence.** Un index régénéré à partir d'une autre version du corpus, ou un
chapitre perdu à la projection, fait échouer la suite de tests sans lancer
l'application.

### D12. Une seule table décide des méthodes réellement jouables

**Contexte.** `use-memory.ts` (capacité mémoire) enchaînait quatre
`case 'heat-words'` successifs : `flashcard`, `recall-writing` et le masquage
aléatoire étaient **inatteignables**. Un `switch` sur un littéral ne signale pas
un bras mort, et aucun test ne montait le hook — trois stratégies déclarées
dans l'énumération n'avaient donc jamais d'action. Par ailleurs le registre de
l'atelier (`app/memorization/start.tsx`) et ce `switch` tenaient chacun leur
propre liste de méthodes, libres de diverger.

**Décision.** `PLAYABLE_STRATEGIES` (dans la capacité mémoire) est la seule
table : elle porte les six stratégies exécutables — masquage progressif,
révélation incrémentale, rappel actif, carte, rappel écrit, masquage intelligent.
L'atelier en dérive ce qu'il affiche et ce qu'il accepte en `?strategy=` ;
`useMemoryCapabilityHook` en dérive les actions. Toute valeur hors table retombe
explicitement sur le masquage progressif (le défaut MVP), jamais sur un écran
sans action.

**Conséquence.** `tests/unit/capabilities/memory-strategies.test.ts` compare la
**signature des actions** de quatre stratégies : quatre signatures distinctes,
sinon échec. Ajouter une méthode à l'atelier sans bras d'exécution, ou débrancher
un bras, casse la suite.

### D13. Les liens sont comparés aux routes effectives, pas aux `path` plats

**Contexte.** L'imbrication du routeur donne des routes dont le `path` ne dit
pas l'URL : les six écrans de `/onboarding/*` valent `/onboarding/<child>`,
`/tabs/progress` est un enfant de `/tabs`. Un contrôle naïf des `path="…"`
les croirait absentes. Symétriquement, rien ne vérifiait qu'un `<Link to>`
pointe vers une route existante : renommer une route sans toucher les liens
envoie l'utilisateur sur le 404, et aucun test ne montait `src/main.tsx`.

**Décision.** `tests/unit/navigation-routes.test.ts` reconstruit les chemins
effectifs par pile de balises `<Route>` (le balayage est manuel : un
`element={<Navigate … />}` contient un `>` dans ses attributs) puis compare les
cibles **statiques** des liens (`to`, `navigate`, `redirect`) à ces chemins. Les
liens construits (`to={\`/bible/explorer/${bookId}\`}`) ne sont pas comparés :
ils demandent d'exécuter l'écran.

**Conséquence.** Une faute de frappe dans une cible de lien fait échouer la
suite (vérifié en cassant volontairement `/tabs/progress`), et les cibles
historiques de D7 restent couvertes.

### D14. Les écrans de la famille ne promettent plus d'envoi

**Contexte.** Trois libellés venaient du temps du service cloud : la séance en
famille annonçait « tes stats seront partagées à la reconnexion », son état non
partagé affichait « {{count}} résultats en attente », et l'écran de
synchronisation disait « ils partiront dès que la connexion revient ». Depuis
D1, aucun serveur distant ne reçoit quoi que ce soit : la donnée est déjà
écrite, il n'y a rien en transit.

**Décision.** Les libellés décrivent l'état mesuré : « réponses sur cet
appareil », « mode local · les réponses restent sur cet appareil », « pas de
serveur distant où les envoyer ». Les clés qui portaient la promesse
(`pendingHint`, `pendingHint2`, `offlineHint`, `pendingResults`) sont supprimées
de `fr`/`en` plutôt que laissées inutilisées : deux vérités dans un catalogue
finissent par être rebranchées par erreur. `liveHint` parle désormais d'un
« instantané partagé » (le collecteur local), pas d'un partage en direct.

**Conséquence.** `tests/design/family-sync-honesty.test.ts` lit le bloc
`familyPlus` des catalogues et échoue sur le vocabulaire d'envoi différé
(reconnexion, « en attente », « shared live »), et vérifie que les trois clés
retirées ne sont plus référencées par un écran.

### D15. Un chiffre non mesuré n'est pas un zéro

**Contexte.** `app/analytics/dashboard.tsx` affichait `stats?.totalVerses || 0`
(et deux autres compteurs). Or `calculateStats()` avale ses erreurs : après un
échec, `stats` reste `null` et l'écran annonçait « 0 verset mémorisé · 0
maîtrisé · série 0 ». Un lecteur y voit une progression nulle, alors que rien
n'a été lu — l'inverse exact de la règle appliquée aux écrans famille, où un
tiret veut dire « pas encore mesuré ».

**Décision.** L'écran retient si une mesure a abouti (`measured`) et affiche
`—` tant que ce n'est pas le cas, pour les cartes, le tableau par statut et le
temps d'apprentissage. Le rafraîchissement remet `measured` à `false` : des
chiffres d'hier présentés comme ceux du jour seraient une autre façon de mentir.

**Conséquence.** `tests/design/analytics-honesty.test.ts` interdit le retour de
`stats?.x || 0` dans l'écran et vérifie que chaque chiffre passe par le drapeau.

### D16. Accueil, calendrier et profil suivent la règle du tiret

**Contexte.** La même faute que D15 existait sur trois autres écrans : l'accueil
affichait `formatProgressLabel(…, total ?? 0, …)` à côté de la valeur
`total ?? '–'` — « 0 verset mémorisé » et « – » dans la même tuile —, et son
`catch` ne remettait à `null` que deux compteurs sur cinq, si bien qu'un échec
de lecture laissait les anciens chiffres à l'écran. Le calendrier de révision
donnait `stats?.x ?? 0` sur trois tuiles ; le profil formattait un gabarit
numérique avec `0` sous une valeur « — ».

**Décision.** Un compteur non lu vaut `null` jusqu'en haut et s'affiche « — » ;
un gabarit qui porte le nombre (`{count}`, `{plural}`) n'est pas formaté sans
nombre. Sur échec de lecture, **tous** les compteurs repassent à `null`, jamais
un sous-ensemble. L'anneau de série borne la valeur à `[0, 7]` avant de calculer
son `strokeDasharray`.

**Conséquence.** `tests/design/home-counts-honesty.test.ts` interdit le retour
des trois motifs (`?? 0` dans un libellé, `catch` partiel, `?? 0` non borné dans
l'anneau) et vérifie les deux autres écrans.

### D17. Le contrôle des visuels mesure le format livré, pas un format attendu

**Contexte.** `scripts/check-theme-assets.mjs` exigeait
`{id}-portrait.png` / `{id}-landscape.png` et lisait un en-tête PNG. Or la
chaîne de production livre du **WebP** : le script déclarait **200 fichiers
manquants** sur un dossier complet, et n'était appelé par aucune commande ni par
la CI — un garde-fou qui échoue toujours ne garde rien. Il annonçait aussi
1024×1536 alors que les fichiers mesurent 832×1248.

**Décision.** Le format et les dimensions se lisent **dans le fichier** (PNG ou
WebP, `VP8`/`VP8L`/`VP8X`), l'extension est cherchée sur le disque (`.webp`
d'abord, `.png` pour une ancienne chaîne), et le seul thème sans visuel
(`objets/obj-miroir`) est déclaré à part — plusieurs écrans l'écartent
explicitement. Le script devient `npm run themes:assets` et rejoint la matrice
`data` de `quality-gate` dans la CI, avec le corpus Bible et les scènes photo et
sacrées.

**Conséquence.** `node scripts/check-theme-assets.mjs` sort en 0 : 99/100
portraits, 99/100 compositions, un thème assumé sans visuel. Les commentaires
d'en-tête du catalogue (`theme-catalog.ts`) donnent les dimensions réelles.

### D18. Les visuels orphelins au nom accentué sont retirés

**Contexte.** `theme-provenance` signalait trois fichiers `obj-clé-*` dans
`public/themes/objets/` : un « é » dans le nom, alors que l'identifiant du
catalogue est `obj-cle` (ASCII) et que `themeLandscapeUrl()` construit l'URL
depuis cet identifiant. Ces fichiers n'étaient donc **servis par aucune URL**
(vérifié : aucune référence dans `src/`, `app/`, `scripts/` ni les locales). Le
portrait montrait par ailleurs une clé sur un parquet, quand `obj-cle` montre un
château de sable : ce n'était pas une variante du même visuel. Deux règles se
contredisaient — D9 (« ne pas supprimer un module sans importeur s'il est
testé ») et le manifeste qui les déclarait orphelins ; un fichier n'est pas un
module, et aucun test ne les décrivait autrement que comme un écart.

**Décision.** Suppression des trois fichiers (paysage, portrait, vignette). Le
manifeste `strays` doit rester vide, et un test refuse désormais **tout nom non
ASCII** sous `public/themes/` — une URL accentuée est valide mais fragile
(encodage, normalisation NFC/NFD, copie Windows/macOS).

**Conséquence.** `public/themes/` compte 396 fichiers WebP (132 paysages,
132 portraits, 132 vignettes) ; `theme-provenance`, `check-theme-assets` et la
suite de tests passent sans avertissement d'orphelin.

