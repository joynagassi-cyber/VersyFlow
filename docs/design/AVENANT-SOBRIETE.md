# Avenant « sobriété » — un seul accent, des icônes disciplinées

Branche `arena/1faeda0f-versyflow`. Aucune couleur, aucun composant, aucune variante
n'a été créé : tout ce qui est décrit ici existe déjà dans le thème (ou est un **alias**
d'un jeton existant).

## 1. Ce qui a changé — et combien

| Défaut constaté | Avant | Après |
| --- | --- | --- |
| Pastilles colorées par fonctionnalité (`bg-icon-bg-rose/purple/blue/green/orange/teal/indigo`) | **40** occurrences dans **10** fichiers | **0** — remplacées par la pastille neutre `.icon-chip` |
| Tables « une couleur par entrée » (`color: 'text-…'` à côté de chaque fonctionnalité) | 4 tables : accueil (8 entrées), Réglages (6 + 5 + 3), QuickDock (8), onboarding FSRS (3) | **0** — champs `color`/`bg` supprimés, la rendu ne dépend plus de la fonctionnalité |
| Icônes colorées au repos dans une pastille | 5 écrans | **0** — l'icône hérite (`currentColor`), `.icon-chip svg { color: var(--muted) }` |
| `text-white` / `bg-black` écrits en dur | **34** `text-white` + **7** `bg-black` dans 23 fichiers | **0** — `--on` (texte sur fond fort) et `--scrim` (voiles), définis dans `globals.css` |
| Quatrième couleur hors palette (`text-info` / bleu) sur une échelle d'état | `Facile → bleu` (revue) | `Facile → --success` (état, pas teinte décorative) |

Écrans touchés : accueil, explorer, réglages, livre, file de révision, communauté sémantique,
concept, dock rapide, `ListItem`, onboarding FSRS.

## 2. Les jetons (tous des alias — aucune couleur inventée)

Ajoutés dans `src/styles/globals.css`, section « AVENANT SOBRIÉTÉ » :

```css
--text: var(--color-text-primary);      --muted: var(--color-text-muted);
--glass: color-mix(in srgb, var(--color-surface) 55%, transparent);
--glass-border: var(--color-border);
--acc: var(--color-primary);            --acc2: var(--color-accent);
--on: var(--color-on-primary);
--success: var(--color-success);        --danger: var(--color-error);
--warning: var(--color-warning);
--scrim / --scrim-strong / --scrim-soft  /* densités de voile */
```

Pastille : `.icon-chip { background: color-mix(in srgb, var(--text) 8%, transparent) }`.
Accent **seulement** au survol / focus : `.action-card:hover .icon-chip` →
`color-mix(in srgb, var(--acc) 16%, transparent)` + icône `--acc`.

Deux écarts assumés par rapport au bloc CSS collé dans l'avenant, et pourquoi :

1. **Pas de `border-radius: 12px` dans `.icon-chip`.** Les composants posent déjà
   `rounded-full` ; une classe nue bat une utilité Tailwind, la pastille serait devenue
   un **carré**. On garde les cercles existants.
2. **`.btn-grad` / `ion-tab-button.tab-selected` n'existent pas dans ce code.** Les règles
   sont conservées comme garde-fous inertes, mais l'onglet actif réel (`BottomTabs`) utilise
   déjà l'accent et le bouton principal déjà `text-on-primary`.

## 3. Audit des couleurs — ce qui a pu être mesuré, et ce qui ne l'a pas été

Le script console de l'avenant (`getComputedStyle` sur chaque écran) **n'a pas pu être
exécuté** : aucun navigateur dans cet environnement (voir `docs/design/AUDIT-FOND-VERRE.md` §0).
**Je ne prétends donc pas** avoir la liste des couleurs calculées à l'écran.

À défaut, inventaire **statique** des familles de couleurs réellement utilisées par écran
(utilitaires Tailwind `text-/bg-/border-`), après correction :

| Écran | Familles présentes |
| --- | --- |
| Accueil | neutres (`text`, `surface`, `border`, `card`) + `primary` + `success` |
| Explorer | neutres + `primary` |
| Progression | neutres + `primary` + `success` + `error` (états) |
| Réglages | neutres + `primary` + `success` + `error` (états) |
| Livre | neutres + `primary` |
| File de révision | neutres + `primary` + `success` + `error` (états) |

Plus aucune famille décorative (`rose`, `blue`, `purple`, `green`, `orange`, `teal`, `indigo`,
`amber`, `violet`, `pink`…) n'apparaît dans `app/` ni `src/components/`.

Couleurs écrites en dur dans l'interface — `grep -rnoE "#[0-9a-fA-F]{3,8}\b" app src/components` :

```
12 occurrences restantes, toutes des REPLIS ou du TEXTE, aucune couleur choisie :
  app/settings/theme-picker.tsx (2)   libellés traduits « Blanc pur #FFFFFF »
  app/family/home.tsx (2)             var(--color-primary-foreground, #fff) — repli dans un var()
  src/components/ui/Primitives.tsx (6) replis var(--color-surface, #fff) + défaut de shadowColor
  src/components/bible/VerseActionBar.tsx (1) un commentaire
```

Le reste des couleurs du dépôt vit là où il doit vivre : `src/styles/*.css`,
`src/theme/tokens.ts`, `ionic-variables.ts`, `theme-catalog.ts`, `tweakcn-presets.ts`
(définitions de thèmes) et `src/dev/device-frames.tsx` (chrome du labo, jamais livré).

⚠️ **Exception signalée, non modifiée** : `src/domains/family/service.ts` crée une famille
avec `color = '#E91E8C'` par défaut, et `app/family/*` laisse l'utilisateur choisir une
couleur de famille (donnée enregistrée en base). C'est une **donnée utilisateur**, pas une
couleur de palette : je ne l'ai pas touchée sans votre accord.

## 4. Vérifications exécutées

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | **0 erreur** |
| `tests/design/sobriety.test.ts` (nouveau, 7 tests) | **7/7** |
| `npx vitest run tests/design` | **182/182** (17 fichiers) |
| `npx vitest run` | **1366 / 1385** — 19 échecs préexistants, inchangés |
| `npx vite build` | **OK** (index 450,88 kB / gzip 127,43) — utilitaires `var(--on)` et `var(--scrim…)` bien émis |
| `npm run verify` (tsc + eslint + tests + audit-plan) | **exit 0** · eslint **0 erreur** sur le périmètre `app src/components src/hooks src/store src/theme tests/design` |

## 5. NON VÉRIFIÉ (à dire franchement)

- **Aucune capture d'écran**, aucun rendu pixel : pas de navigateur ici. Les « captures de
  l'accueil, de la Bible, des Stats et des Réglages, clair/sombre, 2 images de fond »
  **n'ont pas été produites**. Le serveur de dev tourne (port 3000) pour que vous les fassiez.
- Le **script console** de l'avenant reste à exécuter sur votre poste ; il est repris tel quel
  dans l'avenant et n'a pas été modifié.
- Les **cartes ne sont pas encore en verre** : `.surface-glass` / `.card-glass`
  (`bg-card/40 backdrop-blur-2xl` + teinte 22 %) existent déjà mais ne sont utilisés que par
  3 écrans. Généralisation = **étape 3**, pas encore faite.
- L'**accent dynamique** demandé en seconde partie est **déjà en place**, vérifié ligne par ligne :
  `src/theme/image-accent.ts` échantillonne l'image (canvas 48×48) et renvoie
  `primary`, `accentSecondary`, `tint` + `primaryForeground` choisi par contraste ;
  `globals.css` déclare `@property --primary/--ring/--accent/--tint` en `<color>` avec une
  transition de **0,8 s** (`cubic-bezier(0.22, 0.61, 0.36, 1)`).
  `colorthief` / `node-vibrant` ne sont **pas** installés — le canvas suffit et évite une
  dépendance ; je n'en ai ajouté aucune.

## 6. Reste à faire (dans l'ordre du contrat)

1. **É3 — verre** : passer les 450+ surfaces `bg-surface*` en `.glass` (CSS global) et
   mesurer les contrastes texte/carte en clair et en sombre.
2. **É4 — responsive** : colonne unique < 768 px, contenu centré au-delà.
3. **É6 — pluriels** : `{plural}` littéral (17 clés en `fr`), voir §5 de l'audit.
4. Balayage des **536 `text-primary`** restants, écran par écran, pour que l'accent ne
   serve qu'aux cas 2a–2d de l'avenant.
