# 37 — Finition premium : les détails qui trahissent une app « presque finie »

> Objectif : atteindre le niveau de soin de TickTick / Linear / YouVersion —
> aucun détail hasardeux. Ce document liste ce qui a été **mesuré**, ce qui a
> été corrigé, et le contrat qui empêche la régression
> (`tests/design/premium-finish.test.ts`).

---

## 1. Audit — l'état avant

Sept familles de détails étaient laissées à l'improvisation. Comptages faits
sur `app/` + `src/components` :

| Détail | Avant | Pourquoi ce n'est pas « fini » |
| --- | --- | --- |
| Tailles de police littérales | **84** `text-[10px]`/`text-[11px]`/… | Une échelle de 11 pas existait déjà (`tailwind.config.js`), mais 84 endroits la contournaient : impossible de faire évoluer la typographie |
| Focus clavier | **2 fichiers** seulement | Aucun anneau sur 95 % des boutons et liens : navigation clavier invisible |
| `prefers-reduced-motion` | règle **écran par écran** (7 blocs) | Un nouvel écran animé échappait automatiquement au réglage système |
| Sélection de texte / curseur | couleurs du navigateur | Bleu système sur un thème framboise/ocre |
| Bloc de chargement | **6 écrans** avec le même bloc recopié | `aria-hidden` sur tout le bloc : « chargement » annoncé à personne |
| Cibles tactiles | boutons d'icône à **36 px** | Sous les 40 px recommandés, sur les coquilles |
| État désactivé | 5 règles locales différentes (0.4, 0.35, 0.5, `cursor`, rien) | Un bouton désactivé ne se ressemblait jamais d'un écran à l'autre |
| Dates relatives | `i18n.language === 'fr' ? 'Demain' : 'Tomorrow'` | 45 langues annoncées, 2 couvertes ; et un arrondi en tranches de 24 h |
| Chiffres clés | `text-2xl font-extrabold text-success` | Sans-serif gras, couleur d'état : trois conventions pour un même chiffre |
| Noms accessibles | 6 commandes icône seule sans nom | Lecture d'écran : « bouton » |

## 2. Ce qui a été mis en place

### 2.1 Invariants d'interaction (globals.css, section FINITION)

| Règle | Effet |
| --- | --- |
| Anneau de focus unique | `:where(a, button, [role=…]):focus-visible { outline: var(--focus-ring-width) solid var(--acc-text) }` — spécificité nulle : les écrans qui dessinent déjà le leur le gardent. `::part(native)` couvre les composants Ionic (Shadow DOM). |
| État désactivé unique | `[disabled]`/`[aria-disabled]` → `opacity: .45` + `cursor: not-allowed` |
| Sélection + curseur | `::selection` teintée à 26 % de l'accent, `caret-color: var(--acc)` |
| Ressenti natif | `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` |
| Mouvement réduit **global** | `:where(*, *::before, *::after) { animation: none; transition: none }` — les indicateurs (`animate-spin`, squelette) restent animés : ce mouvement porte une information |
| Durées nommées | `--motion-instant/fast/base/slow` + `--ease-standard/emphasized` ; plus aucune durée improvisée dans les nouvelles règles |
| Cible tactile | `--tap-min: 40px` + `.touch-target` (coquilles, croix de fermeture, effacement de recherche) |
| Champs de saisie | un seul focus : bordure d'accent + halo `color-mix(primary 18%)` |
| Cartes cliquables | au pointeur : liseré accentué + élévation 1 px ; au doigt : enfoncement 1,5 % ; rien en mouvement réduit |

### 2.2 Échelle typographique complète

- `3xs` (10 px) et `display` (38 px) ajoutés : **plus une seule** taille
  littérale dans un écran (84 → 0).
- `:is(h1, h2, h3)` → serif du preset, graisse 400 : une seule famille de
  titres, sur 39 presets, y compris sur le thème par défaut.
- `.stat-value` (serif, `tabular-nums`, `--acc-text`) et `.stat-label`
  (micro-capitale 11 px, `--mut`) : un seul rendu de chiffre clé.

### 2.3 Chargement

- `src/components/ui/Skeleton.tsx` : `Skeleton`, `SkeletonLines`,
  `SkeletonScreen`, `LoadingBlock`.
- `.skeleton` : balayage teinté par le **texte du thème** (jamais un gris
  figé), supprimé en mouvement réduit.
- `LoadingBlock` porte `role="status"`, `aria-live="polite"`, `aria-busy` :
  le chargement est enfin annoncé.
- 8 écrans migrés (révisions ×4, mémorisation ×2, Bible ×2) ;
  **0** `animate-pulse` restant.

### 2.4 Dates relatives dans les 45 langues

`src/lib/relative-day.ts` : `relativeDayLabel()` et `calendarDayOffset()`.
`Intl.RelativeTimeFormat` + **jours de calendrier locaux** (et non tranches de
24 h). Six ternaires `fr`/`en` supprimés (file de révision, calendrier) ; les
formes irrégulières (« aujourd’hui », « hier », « 前天 ») viennent de la
plateforme. Cinq tests unitaires couvrent fr, en, es, de, pt-BR, ar, zh-Hant,
ko, sw, une langue inconnue et les cas limites 00 h 30 / 23 h.

### 2.5 Noms accessibles

Six commandes icône seule ont reçu un nom : créer une collection, effacer la
recherche, fermer un panneau de comparaison, actualiser l'analyse, revoir le
flashcard depuis le début, ouvrir le menu de traduction (avec
`aria-haspopup`/`aria-expanded`). Les clés réutilisent l'existant quand il
existait (`common.clear`, `common.close`, `workspace.chooseTranslation`) ;
deux clés secondaires ajoutées (`analytics.reload`, `memory.restartReveal`).

## 3. Le contrat de non-régression

`tests/design/premium-finish.test.ts` — 17 assertions statiques :

- anneau de focus unique (et aucun composant qui le concurrence) ;
- état désactivé unique ; sélection et curseur teintés ;
- `prefers-reduced-motion` global, spinners préservés ;
- six jetons de mouvement nommés ;
- **aucune** taille de police littérale dans `app/` ni `src/components` ;
- serif réservée aux titres ; `.stat-value`/`.stat-label` définies et utilisées ;
- primitives de squelette présentes, annoncées, et **aucun** `animate-pulse` ;
- `.skeleton` animé par le texte du thème, neutralisé en mouvement réduit ;
- `--tap-min` + `.touch-target` utilisés dans les coquilles ;
- les six commandes icône seule nommées ;
- encre des surfaces d'état (`--on-status`).

## 4. Vérifications

```bash
npx tsc -p tsconfig.app.json --noEmit      # 0 erreur
npx vitest run tests/design                # 34 fichiers, 242 tests
npx vitest run                             # 1453 passés ; 19 échecs préexistants
npm run build:mock                         # build OK
```

Les 19 échecs sont ceux de `main` avant cette passe (jeux de données bibliques
absents, WASM FSRS, variables Supabase/PowerSync) — aucun n'est introduit ici.

## 5. Prochaines finitions possibles (mesurées, non faites)

| Sujet | Mesure | Pourquoi pas maintenant |
| --- | --- | --- |
| États vides | 27 blocs écrits à la main vs `EmptyState` (23 usages) | Migration écran par écran, sans bénéfice visuel immédiat |
| Hiérarchie des titres | 27 `<h1>` ; 13 en `text-2xl` | La famille est unifiée ; l'échelle des tailles demande une revue écran par écran |
| Relecture contrastée | `data-contrast='high'` couvert partiellement | Demande des captures sur les 39 presets, hors de portée en CI |
| Micro-copie | quelques libellés sans clé i18n | Chaque clé primaire doit être traduite dans 45 locales |
