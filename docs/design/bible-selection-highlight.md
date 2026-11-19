# Lecture biblique — sélection multiple, surlignage à couleur

> Chantier du 31 octobre 2026. Quatre défauts d'usage, une seule refonte.

## Ce qui n'allait pas

1. On ne pouvait surligner qu'**un verset à la fois**. Un passage de quatre
   versets demandait quatre gestes et produisait quatre teintes sans lien.
2. La sélection d'un verset se signalait par un **fond**. Comme le surlignage
   est lui aussi une couleur de fond, un verset sélectionné *et* surligné ne
   montrait plus qu'une seule couleur : impossible de savoir ce qu'on avait
   choisi ni ce qui était sélectionné.
3. Le surlignage n'avait **qu'une teinte**, et elle n'était pas l'accent : le
   geste le plus fréquent (surligner ce qu'on lit) demandait une décision.
4. Le lavis ne couvrait que les **mots** : les espaces entre les mots, eux,
   restaient blancs, et le bloc coloré s'arrêtait net en fin de ligne au lieu
   de suivre le retour à la ligne.

## Décisions

### Sélection = trait fin pointillé, rien d'autre

```css
.manuscript-verse.is-selected {
  text-decoration: underline dotted 1px;
  text-underline-offset: .32em;
  text-decoration-color: var(--acc-text);
}
```

Ni fond, ni gras, ni changement d'encre. Le trait pointillé est le signal le
plus faible qui reste lisible, et surtout il **coexiste** avec le surlignage :
un verset peut être sélectionné et coloré sans que l'un masque l'autre.

Un appui sélectionne, un second appui sur le même verset le retire. La
sélection est un **ensemble** (`number[]`), pas un index : c'est ce qui rend le
surlignage de groupe possible.

La sélection est bornée à un chapitre. Toucher un verset d'un autre chapitre
repart de zéro : surligner un « intervalle canonique » à cheval sur deux
chapitres n'a pas de sens pour un lecteur.

### Surlignage = lavis sous tout le verset

```css
.manuscript-verse[data-hl] {
  background-image: linear-gradient(
    transparent 0 58%,
    color-mix(in srgb, var(--hl) var(--hl-alpha), transparent) 58% 92%,
    transparent 92%
  );
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
```

- Le dégradé est posé sur l'**élément inline**, pas sur un `span` par mot :
  il court donc sous les espaces et se ferme correctement en fin de ligne.
- `box-decoration-break: clone` fait redémarrer le lavis sur chaque ligne
  fragmentée, au lieu d'étirer un seul dégradé sur toute la hauteur du bloc.
- La bande colorée n'occupe que **34 % de la hauteur de ligne** (42 % en
  sombre) : un lavis, pas un surligneur de bureau.

### Cinq pastilles, l'accent d'abord

`accent | gold | leaf | sky | violet`, dans cet ordre, via
`HIGHLIGHT_COLOR_IDS`. L'accent est en tête **et** par défaut
(`DEFAULT_HIGHLIGHT_COLOR`) : le geste le plus courant ne coûte aucune
décision. Les quatre autres teintes sont des variables de thème
(`--hl-gold`, `--hl-leaf`, `--hl-sky`, `--hl-violet`) avec leurs variantes
sombres — aucune valeur en dur dans les composants.

Re-taper la pastille déjà appliquée **retire** le surlignage : la pastille est
un interrupteur, pas un bouton d'application.

### La barre : compacte parce qu'elle est bornée

L'ancienne barre alignait sept boutons de 64 px avec libellé, débordait et
défilait horizontalement. Aujourd'hui :

- `max-width: 560px` et boutons en `flex: 1 1 0` → ils se **partagent** la
  largeur au lieu de la dépasser ; aucun défilement horizontal possible ;
- une ligne d'en-tête (référence tronquée + nombre de versets + fermeture),
  puis une rangée de sept boutons de 38 px, icône seule, libellé en `title`
  et `aria-label` ;
- la palette s'ouvre **sous** la rangée, sans changer la hauteur de la barre.

Référence compacte : `Genèse 1:3`, `Genèse 1:3-5` pour une plage continue,
`Genèse 1:3.5.9` pour des versets disjoints. Une énumération à virgules
déborderait de la pilule dès six versets ; les points tiennent dans la moitié
de la largeur.

### Typographie

- `.chapter-numeral` — **3,4 em**, couleur de l'accent, en marge du texte,
  en exposant sur la première ligne du chapitre. Il remplace l'ancienne
  lettrine, qui demandait un caractère initial absent de beaucoup de langues.
- `.verse-flow-number` — **0,76 em** (0,62 em avant), couleur de l'accent.
  La même taille dans les deux dispositions (flux et blocs) : deux tailles
  différentes pour la même information donnaient une lecture instable quand on
  changeait de disposition.
- L'ancienne en-tête « Chapitre 3 » a disparu : le grand numéral dit déjà le
  numéro. Le nom du livre n'apparaît qu'une fois (titre ou ligne de
  métadonnées, jamais les deux).

## Migration des données

L'ancien format était un tableau de clés (`["gen:1:1", …]`). Il est relu en
`{v: 2, marks: { "gen:1:1": "accent", … } }` : aucun surlignage perdu, et la
seule interprétation possible pour une couleur qui n'existait pas est l'accent.
Une couleur inconnue dans le nouveau format est rabattue sur l'accent.

## Bug de fond corrigé au passage

`DuoIcon` passait `secondaryOpacity = 0.5` par défaut. La bibliothèque Solar
écrit cette valeur **en style en ligne** sur le `<svg>`, ce qui l'emporte sur
toute règle CSS : les règles `--solar-secondary-opacity` du thème (repos,
survol, activation) ne changeaient donc jamais rien, et le second calque du
duotone restait figé à 50 %. La prop n'a plus de valeur par défaut ; la densité
revient au thème et reste modulable. Elle reste passable ponctuellement.

## Vérification

- `tests/design/bible-selection-highlight.test.tsx` — **15 tests** : magasin,
  migration v1 → v2, référence compacte, sélection/désélection à l'écran
  (quatre appuis, second appui, `aria-pressed`, contenu transmis à la barre),
  et le contrat CSS (pointillé sans fond, `var(--hl)` jamais de constante,
  cinq pastilles, taille du numéro, boutons à parts égales, pas de défilement).
- `tests/design` complet : **444 tests, 60 fichiers**, tout vert.
- `tsc --noEmit` : 0 erreur. `lint` : 0 erreur. `build:mock` : OK.

## Ce qui n'est pas fait

- Les actions de la barre (Mémoriser, Copier, Note, Comparer…) restent des
  actions d'un seul verset côté données : elles reçoivent la sélection mais
  n'appliquent que le premier verset. Seul le surlignage est réellement
  multi-versets.
- Le surlignage n'est pas synchronisé entre appareils (stockage local
  uniquement, comme avant).
