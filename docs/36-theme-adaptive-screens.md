# 36 — Tous les écrans suivent le thème (matériau premium partagé)

> Objectif : qu'un changement de thème (preset tweakcn, clair/sombre, fond
> dégradé, fond image, transparence réduite, contraste élevé) se voie de la
> **même** façon sur les 7 écrans premium *et* sur les ~70 écrans « profonds »
> (Bible, révisions, familles, collections, analyse, recherche, onboarding,
> réglages secondaires…).

---

## 1. Le problème mesuré (avant)

L'application avait deux vocabulaires visuels :

| | Écrans premium (Accueil, Explorer, Progrès, Réglages, Profil, Calendrier, Apparence) | Écrans « profonds » (~70) |
| --- | --- | --- |
| Carte | `.g1` / `.g2` / `.g3` / `.glass` : fond `--gc`, liseré `--bd`, reflet `--hi`, ombre `--sh`, verre sur fond image | `bg-surface` + `shadow-sm` (ombre Tailwind figée, aucun liseré) |
| En-tête | pastille de verre flottante | barre pleine collée au bord, titre sans-serif 16 px |
| Gris discret | `--mut` (suit le thème) | `text-text-muted` = gris **figé** `#98989e` / `#6a5a63` |
| Texte sur état | `text-on-primary` | `text-[color:var(--on)]`, c'est-à-dire l'encre de l'**accent** posée sur `bg-error` |

Trois ruptures en découlaient :

1. **Preset sombre** — `--color-text-muted` n'était ponté par aucun preset :
   `#6a5a63` sur `#171717` = **2,9:1**, sous le seuil AA.
2. **Fond image** — `html[data-bg='image']` ne redéfinissait que les jetons de
   *texte* : `--color-surface` restait blanc opaque. Les cartes premium
   devenaient du verre, les cartes historiques restaient des blocs blancs
   posés sur la photo, avec un texte déjà clair en mode sombre.
3. **Pastilles d'état** — `--on` suit `--primary-foreground`, qui peut être
   blanc (accent sombre). Blanc sur `bg-warning` `#ff9500` = **2,0:1**, et
   l'inverse sur un preset à `--primary-foreground` noir.

## 2. Ce qui a changé

### 2.1 `--on-status`, l'encre des surfaces d'état

```css
:root { --on-status: #14100f; }
.bg-success, .bg-error, .bg-warning, .bg-info { color: var(--on-status); }
```

Les quatre couleurs d'état restent claires dans **tous** les presets, en clair
comme en sombre : une encre sombre y garde ≥ 4,5:1 (mesures : `#ff9500` 9,7:1,
`#00a86b` 5,6:1, `#ff4d6d` 4,9:1, `#007aff` 4,6:1). Les variantes teintées
(`bg-error/10`) ne sont pas touchées. Tailwind expose `text-on-status`.

Tous les `text-[color:var(--on)]` posés sur un état ont été remplacés par
`text-on-status` (Bible, révisions, historique, session, flashcards, succès,
onboarding, réglages). Sur un accent, c'est `text-on-primary` ; sur un texte
inversé (`bg-text-primary`), c'est `text-background`.

### 2.2 Les gris discrets suivent le preset

```css
:root[data-preset]:not([data-bg='image']) {
  --color-text-muted:     color-mix(in srgb, var(--color-text-secondary) 92%, var(--color-text-primary));
  --color-text-tertiary:  color-mix(in srgb, var(--color-text-secondary) 82%, var(--color-text-primary));
  --color-text-placeholder: color-mix(in srgb, var(--color-text-secondary) 55%, var(--color-background));
}
```

`text-text-muted` (322 occurrences) reste plus discret que `text-text-secondary`
mais suit désormais la teinte du preset, en clair **et** en sombre. Le mode
image garde son propre pont (`var(--mut)`).

### 2.3 Matériau commun des cartes historiques

```css
.app-canvas :is(div,article,section,li,button,a).bg-surface
  :is([class~='shadow-sm'],…):not(.g1):not(.g2):not(.g3):not(.glass)
  :not([class*='border-'])  { border: 1px solid var(--color-border); box-shadow: …(--hi, --sh)… }
```

- liseré et ombre **du thème** (plus de `shadow-sm` figé : noir sur noir) ;
- sur fond image, ces mêmes cartes reçoivent le verre de `.g2`
  (`rgba(var(--gc-rgb), var(--ga))` + `backdrop-filter`), et `--color-surface`
  devient translucide pour toutes les autres surfaces (`bg-surface/95` des
  barres d'action, champs, feuilles) ;
- les tuiles à choix (`border-2` + `border-primary`) sont **exclues** : leur
  bordure porte l'état, la repeindre effacerait la sélection ;
- `prefers-reduced-transparency`, `prefers-contrast`, `data-transparency` et
  `data-contrast` ramènent tout à `var(--gc)`, comme pour `.g1/.g2/.g3`.

### 2.4 Les cartes premium imposent leur encre

Dans `.g1/.g2/.g3/.glass`, `text-text-primary` → `var(--tx)`,
`text-text-muted/secondary/tertiary` → `var(--mut)`, `text-primary` →
`var(--acc-text)` (l'accent **lisible**), et `h2/h3` passent en serif
(`--font-serif`, Georgia en repli). Une seule encre et une seule famille de
titres par carte, quel que soit l'écran.

### 2.5 En-tête des écrans profonds

`.full-screen-header` devient une pastille de verre flottante
(`margin`, `border-radius: 24px`, liseré `--bd`, reflet `--hi`, ombre `--sh`,
verre sur fond image) et son titre prend la police serif du preset —
exactement le matériau de `.mobile-header.g1`.

### 2.6 Cartes migrées vers `.g2` / `.glass`

≈ 90 cartes `bg-surface … shadow-sm` réparties sur une quarantaine de fichiers (Bible, révisions,
familles, collections, maîtrise, succès, sémantique, onboarding, réglages,
notifications, recherche, analyse, mémoire, mémorisation). Les primitives
partagées suivent : `FamilyKit.SectionCard`, `OnboardingShell` (titre serif),
`Dialog` (`g3`), `Toast` (`g2`), `ManuscriptView`, `VerseActionBar`, `ModeWrite`.

`.glass` n'avait **aucune** recette de base (seules des règles
`html[data-bg='image'] .glass` existaient) : sur un preset ordinaire ces cartes
ne peignaient rien et dépendaient du `bg-surface` voisin. Il possède désormais
la recette premium complète.

## 3. Ce que ça change pour l'utilisateur

- Changer de preset recolore **toute** l'application, y compris les écrans
  secondaires : plus de carte blanche au milieu d'un thème sombre.
- Choisir un fond image transforme **toutes** les cartes en verre, pas
  seulement celles des 7 écrans premium.
- Les pastilles « en retard », « bon », « difficile », « facile » restent
  lisibles sur les 39 presets, en clair comme en sombre.
- Les titres d'écran et de carte partagent une seule famille serif.

## 4. Garde-fous

```bash
npx tsc -p tsconfig.app.json --noEmit
npx vitest run tests/design        # 225 tests, 33 fichiers
npm run build:mock
```

Les tests de design couvrent les invariants touchés : `no-hardcoded-colors`
(aucune couleur littérale ajoutée), `sobriety`, `theme-tokens` (contrastes des
39 presets), `appearance-glass`, `dark-restraint`, `solar-glass`,
`elevation-and-type`.

## 5. Ce qui n'est **pas** fait (et pourquoi)

- Les champs de formulaire (`Input`, `Select`) gardent `border-border` +
  `bg-surface` : le verre y dégraderait la lisibilité de la saisie.
- Les boutons et pastilles de taille fixe (`h-5 w-5`, `h-10 w-10`) ne sont pas
  des cartes : ils gardent `bg-surface`.
- Les valeurs `--gc` (`#ffffff` / `#171717`) restent neutres par décision de
  design (cf. `docs/06-design-system.md`) : le preset teinte le fond, le texte
  et l'accent, pas le matériau des cartes.
