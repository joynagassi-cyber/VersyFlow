# Étape 1 — le fond (image de thème réellement visible)

Branche `arena/1faeda0f-versyflow`. Aucune image n'a été générée ni remplacée :
les 200 visuels de `public/themes` sont ceux du dépôt (consigne du 30/10 :
« les images sont déjà là, tu corriges comment elles sont appliquées »).

## 1. Pourquoi le fond n'apparaissait pas — trois causes, toutes vérifiées

| # | Cause | Preuve | Correction |
| --- | --- | --- | --- |
| 1 | **L'image n'était posée que si l'accent était déjà extrait.** `resolveTheme` écrivait `--theme-image` *dans* le `if (input.accentValues)`, et `removedVars` contenait `--theme-image` : tant que l'échantillonnage des pixels (asynchrone) n'avait pas abouti, le plan **retirait** l'image. Un changement de largeur relançait le plan et effaçait de nouveau le fond. | `src/theme/resolve-theme.ts`, branche « thème image » | l'image et `data-theme-image` sont posés **toujours** ; l'accent reste optionnel |
| 2 | **Le fond était opaque.** `body` peignait `--color-background`, et les toiles d'écran (`app-canvas`, `screen-column`, `bg-background`) peignaient la même couleur **par-dessus** la couche image. | `globals.css` (anciennes lignes 118-130, 640-651, 747-757) | `body`, `#root`, `ion-app`, `ion-page`, `ion-content`, `.app-canvas`, `.app-main`, `.screen-column`, `[class*='bg-background']:is(div)` → transparents |
| 3 | **Le traitement détruisait l'image.** `blur(32px)` + `scale(1.12)`, et en mode sombre `invert(.85) hue-rotate(180deg)` — une illustration chaude devenait une tache bleue. | `globals.css` (anciennes lignes 148-193) | flou **0 px** (2 px ≥ 1024 px), `saturate(1.1)`, `scale(1.05)`, **aucune inversion** |

## 2. Ce qui a été écrit (`src/styles/globals.css`)

Une **seule** couche, `html::before` :
`position: fixed; inset: 0; z-index: 0` — image `--app-bg-image` **ou** `--theme-image`,
`cover/center`, sans `background-attachment: fixed`. Le contenu est en `z-index: 1` (`#root`).

- **Voile dégradé 0,15 → 0,45** de `--color-background`, dans un bloc `@supports` :
  sans `color-mix` (Safari < 16.2), le voile disparaît mais **l'image reste**, car elle est
  posée par une déclaration séparée, hors du `@supports` (repli couleur unie conservé :
  `background-color: var(--color-background)`).
- **Mode sombre** : plus d'inversion ; le voile suit `--color-background`, donc il est plus
  dense en sombre sans réglage séparé.
- **Aucun `!important`** ajouté, aucun `background-attachment`.

## 3. Vérifications exécutées (mesurées)

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | **0 erreur** |
| `tests/design/background-layer.test.ts` (nouveau, 8 tests) | **8/8** |
| `tests/design/resolve-theme.test.ts` (test réécrit : il codifiait le bug) | **15/15** |
| `npx vitest run tests/design` | **167/167** |
| `npx vitest run` (tout) | **1358 / 1377** — les **19** échecs sont ceux d'avant, inchangés |
| `npx vite build` | **OK** (index 450,88 kB / gzip 127,47) |
| `npm run verify` | **18 PASS · 0 PARTIEL · 0 FAIL · 4 non vérifiables** |
| Serveur de dev | `vite` sur `0.0.0.0:3000`, HTTP 200, CSS servi avec la couche É1 |

## 4. NON VÉRIFIÉ — à dire clairement

- **Aucune capture d'écran**, aucun rendu pixel : pas de navigateur dans cet environnement.
  Les portes « captures 390 / 768 / 1280, clair et sombre » **n'ont pas été franchies ici**.
  Substitut fourni : le serveur de dev en direct (prévisualisation) et la page
  `/__dev/responsive-preview`, qui encadre les routes aux largeurs 390 et 1440.
- **Contraste non mesuré** : il le sera en É3 (texte / carte, clair et sombre), par calcul
  sur les jetons. À ce stade, les cartes restent **opaques** (`bg-surface`), donc la
  lisibilité ne dépend pas encore de la photo.
- **Taille des visuels** : 832×1248 (portrait) et 1248×832 (paysage), PNG de 605 à 1092 Ko.
  Le contrat demande ≥ 1600 px et WebP 200–400 Ko. Sans régénération (consigne), la seule
  voie serait une **conversion** WebP des fichiers existants — je ne l'ai pas faite.

## 5. Comment le voir

1. Ouvrir l'app (serveur de dev), aller dans **Réglages → Apparence → fond « image »** et
   choisir un thème-image : la photo doit être **nette**, sans voile bleu.
2. Pour comparer les largeurs sans navigateur de test : `/__dev/responsive-preview` (390 et 1440).
3. Le mode sombre ne doit plus bleuir l'illustration — c'est le point le plus visible du correctif.

## 6. Prochaine étape (porte)

É2 (jetons) → É3 (verre) : c'est là que les 450+ surfaces `bg-surface*` deviennent du verre
et que les contrastes sont calculés et rapportés. J'attends votre validation de cette étape 1.
