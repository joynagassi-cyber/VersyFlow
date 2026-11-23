# Sources et licences

Ce document recense **tout contenu externe** embarqué dans l'application, sa
provenance et sa licence. Une entrée sans licence vérifiable n'a pas sa place
dans le dépôt.

## 1. Texte biblique

| Contenu | Version | Source | Licence | Fichier |
|---|---|---|---|---|
| Bible, Ancien et Nouveau Testament | **Louis Segond 1910** (LSG) | [eBible.org — fraLSG](https://ebible.org/find/details.php?id=fraLSG) (USFM), converti en JSON par `scripts/bible/` | **Domaine public** — « Cette Bible est dans le domaine public. Elle n'est pas protégée par copyright. » ([mention eBible](https://ebible.org/fraLSG/copyright.htm)) | `data/bible/lsg.json` (source), `public/data/bible/lsg/` (projection par chapitre) |

Caractéristiques vérifiées : 66 livres, 1 189 chapitres, 31 170 versets, aucun
verset vide (`tests/integration/bible-lazy-loading.test.ts`).

### Traductions cataloguées mais non livrées

`data/bible/dataset-catalog.json` liste 56 traductions supplémentaires
(segments `sha256:pending`), présentes à titre de catalogue uniquement : aucun
fichier correspondant n'est versionné, et l'écran des traductions les signale
comme non disponibles. Aucune n'est affichée sans son fichier local.

### Mise en forme du texte

Le texte source contient des artefacts d'import USFM (marqueurs `\b`, `\qs`,
`\it`, espaces après apostrophe d'élision, guillemets anglais). Ils sont
corrigés de façon reproductible par `scripts/bible/repair-lsg-text.mjs`
(idempotent, `--check` en CI) : la correction est un script versionné, pas une
retouche manuelle du fichier.

## 2. Typographie

Polices livrées avec l'application via `@fontsource` (licence SIL Open Font
License 1.1, auto-hébergées, aucun appel à Google Fonts) :

| Police | Usage |
|---|---|
| EB Garamond, Crimson Pro, Spectral, Lora, Bitter, Merriweather, Libre Baskerville, Source Serif 4, Noto Serif, Noto Serif Georgian, Playfair Display | lecture biblique (familles proposées dans les réglages) |
| Inter | interface |
| JetBrains Mono | chiffres, références, code |

## 3. Icônes

| Contenu | Source | Licence |
|---|---|---|
| Jeu d'icônes Solar (duotone) | [`@solar-icons/react`](https://www.npmjs.com/package/@solar-icons/react) | MIT |

Une seule bibliothèque d'icônes, exposée par un unique composant
(`src/components/ui/DuoIcon.tsx`, réexporté par `solar-icons.ts`). Aucune image
d'icône n'est dessinée à la main et aucun emoji n'est utilisé comme icône.

## 4. Images de thème

Les visuels d'arrière-plan vivent dans `public/themes/` (`.webp`) et sont
**produits pour ce projet** à partir de compositions décrites dans
`scripts/themes/`. Ils ne proviennent d'aucune banque d'images tierce ; aucune
attribution n'est donc à afficher. `docs/IMAGES_QA.md` documente le traitement
(recadrage 3:2 / 2:3, `-strip`, WebP q85, vignettes 320 px) et les métriques de
contrôle mesurées sur les 133 vignettes.

## 5. Données de démonstration

Les profils, familles, cartes sémantiques et éléments de marketplace du mode
démo sont **fictifs** et générés localement (`src/dev/mock/`) pour que
l'application soit utilisable sans backend. Aucune donnée personnelle réelle n'y
figure, et l'espace de stockage de la démo est isolé de celui de l'utilisateur
(`tests/design/demo-isolation.test.ts`).

## 6. Dépendances logicielles

L'application n'embarque aucune dépendance à un service distant. Les
bibliothèques utilisées sont listées dans `package.json` et distribuées sous
licences MIT / Apache-2.0 / ISC (React, Vite, Tailwind, Zustand, Zod, ts-fsrs,
Radix UI, Ionic, Capacitor…).
