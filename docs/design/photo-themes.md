# Thèmes photo — lot « 40 images »

État au **30 octobre 2026** : la **chaîne d'intégration est en place et testée**, mais
**aucune des 40 images n'a pu être produite**. Le générateur d'images de l'espace de
travail répond `403 PERMISSION_DENIED` (« account flagged for suspicious activity »)
sur quatre tentatives et trois prompts différents, et la recherche d'images ne renvoie
que des banques sous licence (Shutterstock), inutilisables. Rien n'est donc simulé ni
« pré-rempli » : le catalogue ne contient **aucun** visuel photo et aucune vignette
cassée.

## 1. Contrat de fichiers

Pour une scène `{id}` de catégorie `{category}` :

| Fichier | Chemin | Taille |
| --- | --- | --- |
| Portrait (mobile, thème appliqué) | `public/themes/{category}/{id}-portrait.webp` | 832 × 1248 |
| Paysage (bureau, sélecteur) | `public/themes/{category}/{id}-landscape.webp` | 1248 × 832 |
| Vignette | `public/themes/{category}/{id}-thumb.webp` | 320 px de large |

- Le format WebP n'est pas un choix gratuit : les illustrations existantes sont en PNG
  (≈ 850 Ko pièce), quarante photos en PNG dépasseraient plusieurs centaines de Mo.
  `themePortraitUrl` / `themeLandscapeUrl` lisent l'extension réelle portée par l'entrée
  générée ; `themeThumbUrl` renvoie toujours `-thumb.webp`.
- Le **portrait n'est pas un recadrage du paysage** : les deux cadrages font l'objet de
  prompts distincts (`buildPrompt(scene, 'landscape' | 'portrait')`) et le script refuse
  un paysage et un portrait de taille identique (copie déguisée).
- Aucune image source plus petite que la cible n'est acceptée (pas d'agrandissement).

## 2. Les 20 scènes

Nature (10) — catégorie `photos-nature` :

| id | Nom | Motif |
| --- | --- | --- |
| `pho-feuilles` | Feuillages superposés | feuilles épaisses vert vif superposées, arrière-plan sombre |
| `pho-aurore` | Aurore boréale | aurore verte au-dessus d'un lac et de montagnes enneigées |
| `pho-foret-brume` | Forêt brumeuse | sous-bois brumeux au lever du jour |
| `pho-cascade` | Cascade | cascade, rochers couverts de mousse |
| `pho-dunes` | Dunes au coucher du soleil | ondulations de sable, lumière dorée |
| `pho-lac` | Lac de montagne | lac calme, reflets, brume |
| `pho-vague` | Vague déferlante | écume, lumière rasante |
| `pho-lavande` | Champ de lavande | rangées au crépuscule |
| `pho-falaise` | Falaise côtière | falaises, océan, lumière grise |
| `pho-coquelicots` | Coquelicots | champ rouge, lumière chaude |

Vie & loisirs (10) — catégorie `photos-vie` :

| id | Nom | Motif |
| --- | --- | --- |
| `pho-voiture` | Voiture de sport | voiture de sport, route déserte, reflets |
| `pho-football` | Football | ballon sur la pelouse d'un stade |
| `pho-cafe-livre` | Café & livre | tasse et livre ouvert, lumière du matin |
| `pho-velo` | Vélo en ville | vélo contre un mur ensoleillé |
| `pho-table` | Table partagée | repas vu du dessus |
| `pho-surf` | Surf | planche et océan à l'aube |
| `pho-randonnee` | Randonnée | sentier, sac à dos, horizon |
| `pho-cuisine` | Cuisine | plan de travail, ingrédients frais |
| `pho-bibliotheque` | Bibliothèque | étagères anciennes, lumière chaude |
| `pho-guitare` | Guitare acoustique | guitare dans une pièce calme |

Les couleurs d'accent de repli sont **toutes reprises** de thèmes existants du
catalogue (test dédié) : aucun nouveau choix de couleur.

Contraintes communes des prompts : photoréaliste, lumière douce, **aucun texte, logo,
filigrane, visage identifiable au premier plan**, zone calme plus sombre réservée au
texte d'interface (à gauche en paysage, en bas en portrait).

## 3. Import (une commande)

```bash
# 1. déposer les 40 sources dans artifacts/photos-src/ (non versionné) :
#    {id}-landscape.jpg et {id}-portrait.jpg pour chacune des 20 scènes
npm run themes:photos
```

Le script `scripts/themes/import-photo-themes.mjs` :

1. redimensionne/recadre (`convert -resize …^ -extent`, ImageMagick 6 ou 7) ;
2. écrit les 40 visuels + 20 vignettes dans `public/themes/photos-*` ;
3. réécrit `src/theme/photo-themes.generated.ts` avec **uniquement les scènes dont les
   fichiers existent** ;
4. reprend une scène déjà importée même si ses sources ont été supprimées (relancer le
   script ne « dépublie » jamais un fond) ;
5. affiche les scènes manquantes.

`npm run themes:photos:check` vérifie, sans rien écrire, que le fichier généré liste
exactement les scènes présentes sur disque (code 1 sinon) — c'est ce que lance
`tests/design/photo-themes.test.ts`.

## 4. Intégration au sélecteur

`src/theme/photo-themes.ts` construit les catégories à partir du fichier généré ;
`theme-catalog.ts` concatène ces catégories à la fin des dix catégories illustrées.
Tant que la liste est vide, `THEME_CATEGORIES` et `ALL_THEMES` sont **strictement**
identiques à l'existant (100 entrées) : aucun écran ne change, aucune vignette cassée.
Dès l'import, les 20 scènes apparaissent dans le sélecteur et les réglages existants
(`app/settings/appearance.tsx`, `theme-picker.tsx`) les traitent comme les autres :
miniature WebP, portrait < 1024 px, paysage au-delà, persistance par `accent = id`,
repli `nat-trees`.

## 5. Preuve d'intégration (sans les vraies photos)

Faute de pouvoir générer les 40 visuels définitifs, la chaîne a été exercée de bout en
bout avec **40 images synthétiques** (dégradés) déposées temporairement :

- `npm run themes:photos` → `Scènes importées : 20/20 — visuels générés : 40, vignettes : 20` ;
- `npx vitest run tests/design` → **39 fichiers, 267 tests OK** (catalogue à 120 entrées,
  dimensions et poids vérifiés fichier par fichier, vignettes 320 px, portrait ≠ paysage) ;
- nettoyage : `public/themes/photos-*` supprimés, fichier généré revenu à `[]`,
  `git status` sans visuel photo.

Ces images **n'ont pas été conservées** : elles ne sont pas des photos et n'ont donc pas
leur place dans le catalogue.

## 6. Ce qui reste à faire

| Étape | État |
| --- | --- |
| Contrat de nommage, formats, tailles | fait et testé |
| Import automatique + contrôle de synchro | fait et testé |
| Intégration catalogue / URLs / vignettes | fait et testé (avec images synthétiques) |
| **40 visuels réels + 20 vignettes** | **bloqué** — générateur d'images en 403, banques sous licence inutilisables |

Dès que la génération est débloquée : produire les 40 sources (prompts de
`scripts/themes/photo-scenes.mjs`), lancer `npm run themes:photos`, puis
`npx vitest run tests/design` — le test `chaque scène a portrait, paysage et vignette
conformes` n'est plus ignoré et contrôle chaque fichier.
