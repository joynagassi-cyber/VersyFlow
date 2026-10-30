# Spec « fond image mobile/bureau + réglage flou & verre » — reconnaissance

**Aucun code n'a été écrit pour cette spec.** Ce document ne fait que nommer ce qui existe,
mesurer les écarts avec la spec, et lister les décisions qui bloquent l'implémentation.

Branche `arena/1faeda0f-versyflow`, HEAD `738716d`.

---

## 1. Les fichiers réels (rien n'est inventé)

| Ce que la spec appelle | Fichier réel | Sélecteur / classe réelle |
| --- | --- | --- |
| layout racine | `src/main.tsx` (`IonApp` + `BrowserRouter` + `ThemeManager`) | `#root > ion-app > ion-page` |
| aiguillage des structures | `src/shells/AppShell.tsx` + `src/hooks/useShell.ts` (`useShellKind()`) | rend **un seul** shell : `mobile` / `tablet` / `desktop` |
| shell mobile | `src/shells/MobileShell.tsx` | `div#main-content.app-main.app-canvas` |
| **header mobile** | **inline dans `MobileShell.tsx`** (l. 41) — il n'existe pas de composant dédié | `div.flex.items-center.justify-between.px-4.py-2` |
| **barre du bas** | `src/components/navigation/BottomTabs.tsx` | `<nav className="border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">` (pleine largeur, collée) |
| tiroir mobile | `src/components/navigation/HamburgerMenu.tsx` | — |
| dock « nouvelle session » | `src/components/navigation/QuickDock.tsx` | — |
| shell bureau | `src/shells/DesktopShell.tsx` | `div#main-content.app-main.app-canvas` |
| **sidebar** | `src/components/navigation/DesktopRail.tsx` | `<aside class="desktop-rail fixed inset-y-0 start-0 z-30 … bg-surface">` |
| largeur sidebar | `src/styles/globals.css` | `--rail-expanded: 264px`, `--rail-collapsed: 88px`, `--rail: …` par média (768 / 1024) |
| décalage du contenu | `src/styles/globals.css` | `.app-main { margin-inline-start: var(--rail) }` |
| **header bureau** | `src/shells/DesktopHeader.tsx` | `<header class="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">` — **pas `sticky`** : il est hors de la zone qui défile |
| hauteur d'en-tête | `src/styles/globals.css` | `--shell-header: 56px` (= `h-14`) |
| contenu | `app/(tabs)/*`, `app/**` ; mesure via classes | `.screen-column` (large), `.screen-column-narrow` (lecture) |
| couche de fond actuelle | `src/styles/globals.css` | `html::before` — `position: fixed; inset: 0; z-index: 0`, image + voile **fusionnés** en `background-image` |
| 3ᵉ couche UI | `#root` | `position: relative; z-index: 1` |
| verre existant | `src/styles/globals.css` | `.card-glass` **et** `.surface-glass` : `@apply bg-card/40 backdrop-blur-2xl` + `linear-gradient(--tint 22%)` (3 usages seulement : accueil, onboarding, sélecteur de thème) |
| écran de réglages | `app/settings/appearance.tsx` | contient déjà `Section`, `Toggle`, **`SliderRow`** (`<input type="range">`, label + valeur), et le bloc `backgroundType === 'image'` (l. 339-385) |
| store d'apparence | `src/store/appearance-store.ts` (zustand) | persisté par `MmkvStorage` (`@/infrastructure/storage`), clé `versyflow:appearance:settings`, chargement l. 282, écriture l. 322 |
| accessibilité existante | `globals.css` | `:root[data-transparency='reduced']`, `:root[data-contrast='high']` (glass → opaque, `--color-border` → texte) |
| seuils | `src/hooks/useIsDesktop.ts` | 768 px (rail) et 1024 px (bureau) — déjà la source unique |

`html::after` est **libre** (aucune règle ne l'utilise) : la séparation image / voile ne demande
aucun nouveau nœud DOM.

---

## 2. Écarts entre la spec et le dépôt (chiffrés)

| # | Spec | Réel | Décision nécessaire |
| --- | --- | --- | --- |
| 1 | `[data-bg='image']` | **n'existe pas** ; l'attribut réel est `html[data-theme-image='on']` (+ `data-app-bg='gradient'`), posé par `resolveTheme` | je propose **garder `data-theme-image='on'`** (une seule source) |
| 2 | sidebar 260 px / 64 px repliée | **264 px / 88 px** | garder (non-régression) ou passer à 260/64 ? |
| 3 | contenu 720 lecture / 1100 large | **720 / 1060** (`--reading-width`, `--reading-wide`) | garder 1060 ou passer à 1100 ? |
| 4 | 3 couches (image z0, voile z1, UI z2+) | 1 pseudo (`html::before` z0) + `#root` z1 | séparer le voile dans `html::after` (+ `#root` z2) ou garder fusionné ? |
| 5 | `.glass` avec `--glass-rgb` | aucun `--glass-rgb` ; le verre existant est `bg-card/40` + `--tint` 22 % | créer `--glass-rgb` (255,255,255 / 15,23,42) et une classe `.glass` **distincte** de `.card-glass` ? |
| 6 | `--bg-blur`, `--glass-blur`, `--glass-alpha`, `--veil-alpha` | **aucune** de ces variables n'existe | à créer dans `:root` (une seule source) — pas de conflit de nom |
| 7 | barre du bas flottante 12/12, rayon 22 | pleine largeur, collée, `border-t` | refonte visuelle de `BottomTabs` : feu vert ? |
| 8 | header mobile sticky + `env(safe-area-inset-top)` | header **inline**, non sticky (mais hors zone scrollante → même effet), **sans** safe-area haute | ajouter le padding + la surface verre sans déplacer le header ? |
| 9 | `100dvh` | **0 usage** ; hauteurs en `height: 100%` (html → body → #root) + `overflow: hidden` | passer `html` en `min-height: 100dvh` (et garder la chaîne `100%`) ? |
| 10 | `prefers-reduced-transparency`, `prefers-contrast: more` | **0 usage** ; le dépôt pilote déjà `data-transparency` / `data-contrast` depuis le store | **support partiel** : `prefers-reduced-transparency` n'est pas implémenté par tous les moteurs (je ne peux pas le vérifier ici, réseau limité). Proposé : attributs = source de vérité, `@media (prefers-contrast: more)` en renfort |
| 11 | repli `@supports not (backdrop-filter…)` | **absent** (2 `@supports` existent, aucun sur `backdrop-filter`) | à ajouter |
| 12 | « surfaces lecture » ≥ `max(--glass-alpha, .62)` | aucune notion de surface de lecture en verre aujourd'hui | à créer (classe) sur les écrans de versets/formulaires |
| 13 | modales / feuilles / champs opaques | `.modal-sheet` existe (bas ≤ 767 px, boîte 680 px ≥ 768 px) ; champs = `bg-background` (exclus de la neutralisation) | conserver opaque = rien à faire, à vérifier écran par écran |

---

## 3. Ce que je ferai dès votre feu vert (sans nouvelle question)

1. `:root` : `--bg-blur: 2px; --glass-blur: 18px; --glass-alpha: .40; --veil-alpha: .25;
   --glass-rgb` clair/sombre — **sans** toucher aux jetons de couleur existants.
2. `html::after` = voile dégradé paramétré par `--veil-alpha` ; `html::before` = image
   (`blur(var(--bg-blur)) saturate(1.1) scale(1.05)`), `#root` remonte en `z-index: 2`.
3. `.glass` + `[data-theme-image='on']` : verre de premier niveau sur sidebar, headers, barre du
   bas, cartes principales ; `.glass--reading` avec `max(var(--glass-alpha), .62)`.
4. `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))` →
   alpha ≥ .75 sans flou.
5. `appearance-store` : 4 valeurs + préréglages (`net`, `equilibre`, `doux`, `opaque`) +
   `resetGlass()`, persistées dans le même snapshot que le reste.
6. `app/settings/appearance.tsx` : bloc « Arrière-plan » avec les 4 `SliderRow` déjà présents,
   4 boutons de préréglage + « Réinitialiser », visible **seulement** si `backgroundType === 'image'`.
7. Barre du bas : position fixe, `left/right 12px`, `bottom 12px`, rayon 22 px,
   `padding-bottom: env(safe-area-inset-bottom)`, et `padding-bottom` de contenu équivalent.
8. Pas de nouvelle bibliothèque, pas de deuxième couche image, aucun `!important`.

## 4. Validation (je n'ai pas de navigateur : vous regardez)

Commande : `npm run dev` (Vite, `0.0.0.0:3000`). Le serveur tourne déjà.

À vérifier à **390**, **768**, **1280 px**, en clair **et** en sombre :

1. Image nette et reconnaissable dans les marges et entre les cartes (préréglage « Net » =
   flou 0 px : elle doit être franche).
2. Header, sidebar (≥ 768 px) et barre du bas (< 768 px) laissent voir l'image **floutée** à travers.
3. Aucun texte illisible, même à « Net ».
4. Chaque curseur agit en direct ; « Opaque » rend tout lisible.
5. Après rechargement, les réglages sont conservés (`versyflow:appearance:settings`).

## 5. Décisions qui me manquent

- **A.** Sidebar flottante (12 px de marge, bande d'image visible) ou collée au bord ?
- **B.** Garder les valeurs du dépôt (rail 264/88, contenu 1060) ou passer aux valeurs de la spec (260/64, 1100) ?
- **C.** Attribut : `data-theme-image='on'` (existant) ou nouveau `data-bg='image'` ?
- **D.** Barre du bas flottante 12/12 rayon 22 (spec) — confirmé, ou pleine largeur conservée ?
- **E.** Voile séparé en `html::after` (3 couches de la spec) ou gardé fusionné dans `html::before` ?
