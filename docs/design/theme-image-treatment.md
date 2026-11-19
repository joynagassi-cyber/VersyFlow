# Traitement des visuels de thème — de « brut » à « tirage »

> État au **31 octobre 2026**. Ce document existe parce que le levier évident
> (régénérer les 200 images) a été essayé, jugé insuffisant, puis recadré :
> le défaut dominant n'était pas le dessin mais le **rendu**. Une image brute
> posée en plein écran respire le fichier non retouché.

## 1. La référence, mesurée et non supposée

Le sélecteur de thèmes de TickTick (capture du 29/09) a été découpé tuile par
tuile, puis analysé à **120 px de large** — la taille à laquelle l'utilisateur
juge réellement une vignette. Profil médian sur 9 tuiles, enregistré dans
`docs/design/theme-tone-targets.json` :

| Axe | Référence | Rôle |
| --- | --- | --- |
| `mean` | 0,514 | densité perçue |
| `std` | 0,163 | contraste global |
| `range` (p99−p1) | 0,741 | étirement du contraste |
| `sharpness` | 0,461 | variance du laplacien / variance |
| `colorfulness` | 0,345 | Hasler & Süsstrunk |
| `saturation` | 0,542 | saturation moyenne |
| `warmth` | +0,061 | R−B moyen |

**Premier enseignement contre-intuitif** : la référence n'est **pas sombre**
(moyenne 0,514) et **pas saturée à l'extrême** (0,542). Ce qui la distingue
n'est donc pas un « voile noir » mais un **contraste tenu** et une **vivacité
mesurée**. Chasser la profondeur par l'assombrissement était une fausse piste.

## 2. Ce qui a été essayé, et pourquoi ça a échoué

### 2.1 Viser la cible absolue — échec instructif

`theme-autotune.mjs --target` pilote gamma, niveaux, sigmoïde, saturation et
netteté vers le profil ci-dessus, par boucle fermée. Sur Le Caire, il atteint
un score de **0,088** — et produit un **soleil cyan**.

La cause : l'optimiseur gagne sur les moyennes en triturant les canaux. Les
gardes-fous ajoutés à ce moment-là (plafond de saturation 128 %, dérive de
teinte ≤ 10°, détection par zones) attrapent le cas extrême, mais le principe
reste faux : **une moyenne globale ne décrit pas une image juste**.

### 2.2 Les axes qui ne doivent pas être pilotés

`saturation` et `warmth` décrivent l'**identité de la scène**, pas la qualité
du rendu : un coucher de soleil au Caire est chaud par nature. Les forcer vers
une cible unique grise toutes les catégories et les rend interchangeables.
Ils restent mesurés, à titre de diagnostic.

### 2.3 `-vignette` d'ImageMagick 6 éclaircit

Piège vérifié à la mesure : `-vignette` compose un halo **blanc**. Sur une
photo sombre, la luminosité moyenne passe de `0,239` à `0,620`. Remplacé par
une **multiplication** par dégradé radial.

## 3. Ce que disent les sources, et ce qu'on en retient

- **Saturation ≠ vibrance.** La saturation pousse uniformément, y compris les
  couleurs déjà proches du maximum, qui **décrochent** (clipping) et perdent
  tout détail — c'est littéralement le soleil cyan. La vibrance n'agit que sur
  les couleurs peu saturées et épargne les autres.
- **Le sur-sharpening au format vignette fabrique un catalogue.** Un
  `unsharp` appliqué uniformément après redimensionnement « paraît net isolé,
  mais crée un rendu hyper-réel » à l'échelle de la vignette ; les pipelines
  soignés **sautent la netteté sur le contenu photographique**.
- **Réglages d'unsharp de référence** : rayon ~1,5 px, quantité ~1,3, seuil
  non nul pour ne pas amplifier le bruit fin ; réduire la quantité dès que des
  halos apparaissent.

Conséquences appliquées : saturation **plafonnée à 112 %**, netteté en deux
rayons faibles (`0x1.0+0.8`, `0x0.5+0.4`) avec seuil, et surtout **aucune
recherche de cible sur la couleur**.

## 4. La recette retenue — « bornée »

`theme-autotune.mjs --bounded` applique, en une passe et sans dérive possible :

```
-level 1%,99.2%                  → resserre le point noir et le point blanc
-sigmoidal-contrast 3.4,50%      → courbe en S : densité sans brûler les blancs
-modulate 100,112,100            → saturation plafonnée
-unsharp 0x1.0+0.8+0.015         → micro-contraste
-unsharp 0x0.5+0.4+0            → piqué des bords fins
```

Aucun gamma agressif (borné à ±0,04 s'il est piloté), aucune multiplication de
canaux : **on ne touche pas à la balance des blancs**, c'est elle qui portait
l'identité de chaque scène.

### Résultats sur l'échantillon de 10 thèmes (10 catégories différentes)

| Thème | Contraste avant | Après | Gain |
| --- | --- | --- | --- |
| `ani-abeille` | 0,128 | 0,144 | +12 % |
| `esprit-dove` | 0,178 | 0,201 | +13 % |
| `ev-ascension` | 0,109 | 0,129 | +18 % |
| `frat-cord` | 0,128 | 0,148 | +15 % |
| `lum-bougie` | 0,102 | 0,110 | +8 % |
| `nat-cactus` | 0,107 | 0,121 | +13 % |
| `obj-anchor` | 0,089 | 0,107 | +21 % |
| `sag-colonne` | 0,169 | 0,194 | +15 % |
| `sai-autome` | 0,143 | 0,165 | +16 % |
| `villes-berlin` | 0,123 | 0,149 | +21 % |
| **moyenne** | **0,128** | **0,147** | **+15 %** |

Luminosité quasi stable (0,609 → 0,619) : c'est voulu — on densifie le
contraste, on ne repeint pas la scène.

Planche : `docs/artwork/themes-echantillon-10-avant-apres.jpg` (avant en haut,
après en bas, même ordre).

## 5. Réserves, à trancher avant généralisation

1. **Le gain est réel mais modeste** (+15 % de contraste). Il ne transforme pas
   un dessin plat en illustration à plusieurs plans. Le saut de qualité reste
   la régénération.
2. **Les aplats vectoriels réagissent différemment des photos.** Sur les 40
   photos, la même chaîne donne +62 % de netteté ; sur les illustrations, +15 %
   de contraste seulement. Deux dosages séparés sont probablement nécessaires.
3. **La vibrance n'est pas implémentée.** ImageMagick 6 n'en a pas
   l'équivalent : la recette plafonne la saturation au lieu de la moduler par
   zone. C'est un compromis assumé, pas la solution idéale.
4. **Le lot est appliqué** (31/10/2026, décision de l'auteur après revue de
   l'échantillon) : 100 illustrations et 40 photos traitées, PNG convertis en
   WebP, `public/themes/` passe de **163 Mo à 17 Mo**. Planche de contrôle :
   `docs/artwork/themes-100-avant-apres.jpg` (avant en haut, après en bas).
   Réserve constatée après application : une poignée de scènes très colorées
   (magenta, rouge) paraissent **suraaturées** au plafond de 112 %.

## 6. Outils

| Script | Rôle |
| --- | --- |
| `scripts/themes/theme-metrics.mjs` | mesures normalisées (120 px), profil médian, dérive de teinte par zones |
| `scripts/themes/theme-metrics.py` | même chose en Python/NumPy, pour l'analyse hors chaîne |
| `scripts/themes/theme-autotune.mjs` | `--target` (boucle fermée) et `--bounded` (recette sûre) |
| `scripts/themes/theme-frame.mjs` | voile bas, filet intérieur, ruban de couleur, grain |
| `scripts/themes/theme-treat.mjs` | premier essai de tirage (densité, chaleur, netteté, bords) |

Les cibles mesurées sont versionnées : `docs/design/theme-tone-targets.json`.
