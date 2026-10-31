# Mise en valeur des visuels — l'affichage, pas l'image

> État au **31 octobre 2026**. Ce document existe parce qu'on a longuement
> retouché 240 images pour découvrir que **l'affichage les détruisait**.
> Une image parfaite, floutée puis recouverte d'un voile opaque, reste une
> tache. La leçon est écrite ici pour ne pas avoir à la réapprendre.

## 1. Ce qui n'allait pas

### 1.1 Le preset par défaut effaçait l'image

`GLASS_PRESETS.equilibre` — celui qui s'applique à l'installation — valait :

```ts
equilibre: { bgBlur: 10, glassBlur: 22, glassAlpha: 42, veilAlpha: 100 }
```

Traduction : **10 px de flou** sur le fond, puis un voile noir **opaque à
100 %**. Sur un écran de téléphone, l'image devenait une brume colorée. Aucun
traitement de fichier ne pouvait compenser ça.

### 1.2 Le voile était uniforme, et ses valeurs cumulées

`html[data-bg='image']::after` peignait un dégradé `rgba(…,.85) → rgba(…,.90)`,
ensuite multiplié par `opacity: var(--veil)`. À `--veil: 1`, l'image était
cachée à **90 %** — y compris dans le haut de l'écran, là où elle ne gêne
aucun texte.

### 1.3 La vignette rognait le sujet

Le sélecteur affichait des vignettes en `aspect-ratio: 4/3`, alors que les
visuels sont en **3/2**. `object-fit: cover` supprimait donc 15 % de la
hauteur : sur une scène composée avec le sujet dans le haut et une zone calme
en bas, c'est le sujet qui disparaissait.

### 1.4 Le cadrage ignorait la composition

`background-position: center` sur un écran 19,5:9 recadrait violemment les
portraits, qui sont composés pour un cadre 2:3.

## 2. Ce qui a été changé

| Levier | Avant | Après |
| --- | --- | --- |
| Flou du fond (défaut) | 10 px | **2 px** |
| Voile utilisateur (défaut) | 100 % | **62 %** |
| Forme du voile | plat 0,85 → 0,90 | **dégradé 0 → 0,62** (le haut respire) |
| `background-position` | `center` | `center 38%` (sujet en haut) |
| `transform: scale` | 1.05 | **1.02** (pas de ré-agrandissement) |
| Ratio de vignette | 4/3 | **3/2** (celui des fichiers) |
| Cadrage de vignette | centré | `object-position: center 38%` |
| `filter: blur(0px)` | composait une couche | `--bg-filter: none` à 0 |

### Pourquoi le contraste du texte n'est pas menacé

La lisibilité ne dépend **pas** du voile, mais du **plancher d'opacité des
cartes** (`--glass-alpha-min`, ≥ 0,8), et `tests/design/contrast-surfaces.test.ts`
vérifie AA (4,5:1) pour **voile 0, 0,6 et 1**, sur les images extrêmes. Le
voile est donc un choix esthétique, pas une béquille de lisibilité. C'est
cette séparation qui autorise à le baisser.

## 3. Preuves

- `docs/artwork/theme-affichage-tel-avant-apres.jpg` — écran 390×844 simulé,
  même image, réglages avant (gauche) et après (droite). La gauche est une
  brume rose : c'est ce que voyait l'utilisateur.
- `docs/artwork/theme-vignette-ratio-avant-apres.jpg` — la même scène en 4/3
  (avant) et 3/2 (après).

## 4. Réglages laissés à l'utilisateur

Les presets restent modifiables (`net`, `equilibre`, `doux`, `opaque`), et
`--bg-filter` suit `bgBlur` : à 0, aucun filtre n'est déclaré (un `blur(0px)`
crée une couche de composition qui adoucit inutilement le texte). Le preset
`opaque` conserve un voile à 100 % pour qui veut l'ancien rendu.

## 5. Ce que ce chantier a coûté, et ce qu'il faut en retenir

Le traitement d'image (voir `theme-image-treatment.md`) a demandé une
calibration, des mesures, et plusieurs échecs. Il apporte **+15 % de
contraste**. Changer trois valeurs CSS apporte un facteur **bien plus grand**
sur le rendu perçu. La prochaine fois, on regarde d'abord comment l'image est
affichée, ensuite comment elle est fabriquée.
