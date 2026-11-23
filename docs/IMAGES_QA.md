# Images de thème — origine, traitement, contrôle qualité

Les visuels d'arrière-plan de VersyFlow vivent dans `public/themes/`. Ce
document dit **d'où ils viennent**, **comment ils sont fabriqués** et **comment
on vérifie qu'ils restent utilisables** (lisibilité du texte par-dessus). Ce
fichier est celui que cite `docs/SOURCES.md` §4.

## 1. Ce qui est livré

Mesuré le 2026-11-19 sur `public/themes/` :

| Mesure | Valeur |
| --- | --- |
| Catégories (un dossier chacune) | **14** |
| Fichiers `.webp` | **396** (22 Mo sur disque, blocs de 4 Ko) |
| dont vignettes `*-thumb.webp` | **132** (1,0 Mo, 8 Ko de moyenne, 27 Ko au plus) |
| Nombres d'images | 132 paysages, 132 portraits, 132 vignettes (99 thèmes illustrés + 20 scènes photo + 13 scènes sacrées) |

| Format | Dimensions | Usage |
| --- | --- | --- |
| `*-landscape.webp` | 1248 × 832 (3:2) | fond d'écran en mode paysage, bureau |
| `*-portrait.webp` | 832 × 1248 (2:3) | fond d'écran en mode portrait, téléphone |
| `*-thumb.webp` | 320 × 213 | sélecteur de thèmes (grille) |

Aucune image n'est servie sans sa vignette : le sélecteur charge 133 × 8 Ko
(~1 Mo) au lieu de 20 Mo.

## 2. Origine des visuels

Ces compositions sont **produites pour ce projet** (scènes décrites dans
`scripts/themes/photo-scenes.mjs` et `scripts/themes/sacred-scenes.mjs`), et non
téléchargées depuis une banque d'images. Il n'y a donc ni attribution à
collecter, ni licence tierce à suivre pour `public/themes/`. Les dépendances
logicielles, elles, sont listées dans `docs/SOURCES.md` §6.

## 3. Chaîne de production

```bash
# 1. sources de scène (une entrée par thème) → rendu image
#    (voir scripts/themes/*-scenes.mjs et artifacts/{photos,sacred}-src/, hors git)
# 2. recadrage + conversion + vignette
node scripts/themes/import-photo-themes.mjs
node scripts/themes/import-sacred-themes.mjs
# 3. mesures de tonalité (facultatif, contrôle)
node -e "import('./scripts/themes/theme-metrics.mjs').then(m=>console.log(m.measure('public/themes/saisons/sai-dawn-thumb.webp')))"
```

Les scripts d'import appellent **ImageMagick** (`magick` ou `convert`, testé au
démarrage) :

| Étape | Réglage | Pourquoi |
| --- | --- | --- |
| orientation | `-auto-orient` | une source tournée à la prise de vue ne sort pas couchée |
| recadrage | `-resize` + `-gravity center -extent` (3:2 / 2:3) | un seul cadrage pour toutes les images : la grille du sélecteur ne « saute » pas |
| métadonnées | `-strip` | ni GPS, ni appareil, ni date : rien de personnel dans le build |
| encodage | `-quality 85` en WebP | meilleur compromis mesuré poids/lisibilité du texte |

Le rendu des images n'est pas reproductible à partir du dépôt seul (les
sources brutes sont exclues : `/artifacts/photos-src/`, `/artifacts/sacred-src/`
dans `.gitignore`). Ce qui **est** reproductible — et donc vérifiable — c'est le
traitement et le contrôle qualité ci-dessous.

## 4. Contrôle qualité — ce qui est mesuré, pas jugé

**Intégrité des fichiers** : `npm run themes:assets`
(`scripts/check-theme-assets.mjs`) vérifie que chaque thème du catalogue a ses
deux visuels, avec les dimensions réellement livrées — 832×1248 (portrait) et
1248×832 (paysage), lues dans l'en-tête du fichier, en WebP comme en PNG. Il
signale aussi une « fausse » composition bureau (copie octet pour octet du
portrait). Le seul thème sans visuel, `objets/obj-miroir`, est déclaré à part :
plusieurs écrans l'écartent explicitement, ce n'est pas un oubli silencieux.
La CI l'exécute dans la matrice `data` de `quality-gate`.

**Noms de fichiers** : les identifiants de thème sont ASCII, donc les fichiers
aussi. Trois visuels `obj-clé-*` (accent dans le nom, identifiant absent du
catalogue, servis par aucune URL) ont été retirés le 2026-11-19 ; un test
(`tests/design/theme-provenance.test.ts`) refuse désormais tout nom non ASCII
dans `public/themes/`.

**Mesures de tonalité** : `scripts/themes/theme-metrics.mjs` mesure chaque image
**à 120 px de large** : c'est la taille d'une vignette de sélecteur, donc la
taille à laquelle l'utilisateur juge réellement. Conventions (identiques au
script Python `theme-metrics.py`) :

| Mesure | Définition | Sert à |
| --- | --- | --- |
| `p50` | luminance médiane [0–1] | image plutôt claire ou sombre |
| `text_zone` | écart de luminance entre le haut et le bas | le texte doit rester lisible sur les deux |
| `sharpness` | variance du laplacien / variance de l'image | une image floue ne porte pas un fond |
| `colorfulness` | Hasler & Süsstrunk | saturation perçue, pas le seul taux de pixels colorés |
| `highlights` | part de pixels quasi blancs | une zone brûlée rend le texte illisible |

Les cibles sont dans `docs/design/theme-tone-targets.json`.

### Distribution mesurée (133 vignettes, 2026-11-19)

| Mesure | min | médiane | max |
| --- | --- | --- | --- |
| `p50` (luminance) | 0,085 | 0,550 | 1,000 |
| `text_zone` | −0,361 | 0,192 | 0,486 |
| `sharpness` | 0,061 | 0,497 | 2,191 |
| `colorfulness` | 0,033 | 0,224 | 0,405 |
| `highlights` (pixels quasi blancs) | 0,000 | 0,002 | 0,898 |

Lecture : la collection couvre volontairement du très sombre au très clair
(`photos-nature/pho-feuilles` à `p50` 0,085 ; `saisons/sai-dawn` à 1,000).
**C'est pourquoi la couleur du texte n'est jamais fixée par l'image** : elle est
choisie par le résolveur de thème à partir du contraste réel (voir
`docs/design/design-system.md` §4 et `src/theme/`), et l'attribut
`data-bg="image"` bascule les jetons. Une image claire ne rend donc pas le texte
blanc illisible ; elle change le jeu de jetons.

Les deux extrêmes restent à surveiller à l'œil sur un appareil : une image très
claire (`highlights` > 0,5) est celle qui met le plus à l'épreuve le résolveur.

## 5. Ce qui reste manuel

- **Jugement esthétique** : quel visuel va avec quelle scène — aucune mesure ne
  le remplace.
- **Rendu réel** : la lisibilité perçue se juge sur un écran ; le contrôle
  automatisable est le contraste des jetons, fait par l'audit
  (`node scripts/audit-plan.mjs`, contrôle C04 : 390 paires, pire 4,50:1).
- **Captures d'écran** : `scripts/visual-check.mjs` les produit sur une machine
  qui a Playwright (voir `docs/plan/verification-manuelle.md`). L'environnement
  de développement de ce dépôt n'en a pas ; tant que c'est le cas, il n'existe
  **pas** de dossier `docs/screenshots/` versionné, et ce n'est pas une
  omission : c'est une preuve qu'on ne peut pas fabriquer ici.
