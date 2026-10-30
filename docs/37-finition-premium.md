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

`tests/design/premium-finish.test.ts` — 18 assertions statiques :

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
npx vitest run tests/design                # 36 fichiers, 266 tests
npx vitest run tests/unit                  # 864 passés ; 17 échecs préexistants
npm run build:mock                         # build OK
```

Les 17 échecs sont ceux de `main` avant cette passe (jeux de données bibliques
absents, WASM FSRS, variables Supabase/PowerSync) — aucun n'est introduit ici.
La parité i18n (`tests/unit/i18n/parity.test.ts`, 4 tests) est verte : chaque clé
utilisée existe en `fr` **et** en `en`.

## 4 bis. Lots E–F — le mode Famille en section, et 80 écrans qui suivent le thème

### Lot E — mode Famille (21 écrans, 3 685 lignes)

| Avant | Après |
| --- | --- |
| Aucun repère entre les 21 écrans | `FamilySubnav` sur les 6 sections : 40 px de cible, `aria-current="page"`, défilement horizontal (jamais de rangée cassée en deux) |
| Carte `rounded-[28px] bg-primary` + `conic-gradient` inline pour la série | `FamilyHero` : `.stat-value` (serif, tabulaire, encre d'accent) + `ProgressRing` annoncé (`role="img"`, `aria-label`) |
| 7 tuiles de raccourcis doublonnant les sections | 3 outils réels (arbre sémantique, notes, synchronisation) |
| `« Chargement… »` en texte, erreurs en `<div>` ad hoc | `LoadingBlock` (squelette + `role="status"`), `EmptyState` (icône, action) |
| 3 tailles d'avatar, 3 écritures de liste | `MemberRow` / `MetricRow` uniques, `MemberAvatar` seul fournisseur d'avatar |
| Interrupteurs maison (28 px, `aria-pressed`) | `Switch` partagé : 40 px, `role="switch"`, `aria-checked`, mouvement du thème |
| Pastilles de réaction en `bg-surface-tint` concaténé | `Chip` (32 px, `aria-pressed`, survol sur pointeur fin seulement) |

### Lot F — tous les écrans suivent le thème

| Défaut | Correction systémique |
| --- | --- |
| 17 `Georgia,serif` écrits en dur (les 7 écrans premium suivaient le preset, les autres non) | `var(--font-serif, Georgia), serif` partout : Lora, Playfair, Libre Baskerville selon le preset |
| Titres de carte sans-serif gras, frères du titre serif de l'en-tête | `:is(.g1,.g2,.g3) :is(h2,h3)` reprend la serif du preset ; les micro-capitales restent en sans-serif |
| Cartes `bg-surface + shadow-sm` sans liseré ni verre | Matériau commun : liseré `--bd`, reflet `--hi`, ombre `--sh`, verre sur fond image, plein en transparence réduite |
| Chiffres clés de Maîtrise / Points en `font-extrabold` | `.stat-value` (serif, tabulaire, `--acc-text`) |
| Glyphes `✓` et `✨` dans les locales | Icônes Solar ; copies nettoyées en `fr` et `en` |
| Chaînes françaises en dur (accueil, FSRS, onboarding, `ErrorBoundary`, panneau de fond) | Clés i18n (`home.memorizeDesc`, `onboarding.fsrs*`, `errorBoundary.*`, `appearanceEditor.*`) |
| Commandes mortes (« Sauvegarder » sans action, suppression de compte inerte) | Bouton supprimé ; l'export mène à « Activités & Données », la suppression explique pourquoi elle exige une session connectée |
| Cartes non actionnables au survol | `:where(button,a):is(.g1,.g2,.g3)` : élévation de 1 px au pointeur fin, neutralisée en mouvement réduit |
| Faux contenu présenté comme réel : « Mes favoris » (12 versets inventés) et flashcards (3 cartes en dur, sans service) | Collections vides au premier lancement ; flashcards lues dans le service de mémorisation, avec `EmptyState` honnête quand il n'y a rien à réviser |

### Contrats ajoutés

- `tests/design/family-mode.test.ts` (9) : sous-navigation sur les 6 sections,
  `aria-current` unique, styles `.family-subnav*`, aucun `conic-gradient`,
  `MemberRow` pour les listes, aucun rayon littéral, aucun emoji, aucun
  « Chargement… » nu, `EmptyState` seul pour les vides.
- `tests/design/theme-adaptive-screens.test.ts` (16) : surfaces translucides en
  fond image, matériau des cartes historiques, aucune police en dur, encre
  `text-on-status`, aucun `<button>` sans action, un seul `role="switch"`,
  échelle de titres unique et fluide, **aucune donnée fabriquée** dans un
  écran.
- `tests/design/premium-finish.test.ts` : la règle serif admet désormais ses
  exemptions explicites (`.section-label`, `.stat-label`, `.micro-label`).

## 4 ter. Lot G — les détails qui restaient « presque » justes

Trois détails mesurés après les lots E–F, et corrigés au niveau système.

| Défaut | Mesure avant | Correction |
| --- | --- | --- |
| « Verset du jour » fabriqué | 5 versets français écrits dans `app/(tabs)/index.tsx`, affichés **quelle que soit la langue et la traduction** ; le commentaire promettait « real records preferred » alors que le code ne lisait jamais les versets mémorisés | Le verset du jour est l'un des versets réellement mémorisés (choix déterministe par jour), dans la traduction de l'utilisateur ; sans verset, la carte invite à en choisir un (`home.firstVerseTitle/Hint`) au lieu d'afficher un texte étranger à l'interface |
| Interrupteurs maison | 2 écrans de réglages redessinaient la piste et la pastille (28 px et 24 px, `aria-pressed`) | `ui/Switch` partout : 40 px, `role="switch"`, `aria-checked`, nom accessible obligatoire, mouvement du thème |
| Commandes icône seule sous 40 px | retrait d'une traduction comparée à **23 px** (`p-1`) | `.touch-target` (40 px) : c'est la dernière cible sous le seuil |
| Titres de carte | **23** `<p class="text-base font-bold text-text-primary">` dans 15 fichiers alors que `h1|h2|h3` portent la serif du preset : deux rôles de titre pour la même fonction | `.card-title` (serif du preset, 16 px, graisse 400) porté par `<h2>`/`<h3>` quand la carte est un contenu, par `<span>` quand la carte **est** une commande |
| Statuts dupliqués en français | `« N verset(s) exporte(s) »` concaténé dans l'écran, et des clés `settings.backup.*` qui ne se résolvaient pas (`settings.backup` est une **chaîne**, pas un objet) | `settings.backupScreen.*` en `fr` et `en` (exporté / importé / échec / fichier illisible), plus les deux explications de bascule |

| Chiffres clés en sans-serif gras | **11** grands nombres encore en `font-extrabold` (scores, compteurs, `404`, jours avant rappel) alors que `.stat-value` existait | `.stat-value` partout (serif, tabulaire, `--acc-text`) ; seuls les logotypes et les pastilles d'état gardent leur graisse |
| Clés invisibles au contrat i18n | 12 clés à **deux points** (`workspace.status.new`, `onboarding.benefit1Title`…) n'existaient pas : les 43 locales non fr/en affichaient la valeur de repli française. `parity.test.ts` ne les voyait pas (son expression régulière n'accepte qu'un point) | Clés ajoutées en `fr` et `en` ; nouveau contrat `tests/unit/i18n/keys-exist.test.ts` qui aplatit les locales comme `i18next-init.ts` et vérifie **toutes** les clés littérales |
| Étiquettes de note en français | `« A revoir », « Difficile », « Bon », « Facile »` écrits dans `History.tsx` | Clés `session.rating*` (déjà traduites en 45 langues) |
| Chargements en phrase | `progress.tsx` posait « Chargement des statistiques… » dans une carte alors que 6 écrans avaient déjà un squelette | `ProgressSkeleton` : quatre tuiles puis deux cartes aux mêmes paddings que le vrai contenu, `role="status"` + `aria-busy` + libellé `sr-only` |

| Barre d'onglets | Point d'état rendu seulement si actif : la barre se décalait de 4 px à chaque onglet ; nom accessible `« Navigation principale »` écrit en français ; aucune rétroaction au survol | Indicateur toujours rendu (transparent au repos), `shell.mainNav` traduit, survol et appui teintés `--color-surface-tint` |
| En-tête de bureau | 2 commandes de **36 px** et 2 anneaux de focus en utilitaire | 40 px, focus unique du système, `hover` conservé |
| Tiroir et accès rapide | fermetures à ~28 px (`p-1.5`), `aria-label="Fermer"` en français, poignée de **5 px** à viser au pouce, entrées de menu à 40 px | `.touch-target`, `common.close`, poignée dans une cible de 32 px, entrées à 44 px |
| Feuille modale | `background: var(--color-surface)` : un blanc opaque sur un thème teinté, aucun verre sur fond image | `var(--gc)` + liseré + reflet, verre sur fond image, plein en transparence réduite |
| Focus des champs | `focus:ring-*` écran par écran (parfois bleu système) | Une règle pour `input`/`textarea`/`select` (cases et radios exclues) : bordure d'accent + halo calculé sur `--color-primary` |
| État vide du tableau de bord | bloc centré écrit à la main | `EmptyState tone="inline"` |

Contrat : `tests/design/controls-and-headings.test.ts` (10) — aucun faux
interrupteur, les réglages à bascule passent par `ui/Switch`, aucune commande
icône seule sous la cible tactile, aucun titre de carte en `<p>` gras,
`aria-expanded` + nom accessible sur une commande qui déplie du contenu.
Et `tests/design/loading-and-empty.test.ts` (5) : chargement en squelette sur
les tableaux de bord, libellé annoncé, titre d'état vide sémantique (`h3`),
surface de squelette issue du thème.
Enfin `tests/design/shell-and-sheets.test.ts` (10) : indicateur d'onglet
toujours rendu, nom accessible de la navigation, commandes de coquille à
40 px et nommées, feuille modale au matériau du thème (verre sur fond image,
pleine en transparence réduite), focus de champ unique.

## 5. Prochaines finitions possibles (mesurées, non faites)

| Sujet | Mesure | Pourquoi pas maintenant |
| --- | --- | --- |
| États vides résiduels | 27 blocs écrits à la main pour 23 fichiers qui utilisent déjà `EmptyState` | Les derniers sont des zones d'action pointillées (scan QR) ou des encarts d'explication, pas des vides |
| Relecture contrastée | `data-contrast='high'` couvert partiellement | Demande des captures sur les 39 presets, hors de portée en CI |
| Micro-copie | quelques libellés secondaires sans clé i18n | Chaque clé primaire doit être traduite dans 45 locales |
| Cibles tactiles | puces de texte à 32 px | Choix assumé : agrandir une puce casserait la densité des listes |
| Clés primaires hors `fr`/`en` | 12 clés récentes (`onboarding.benefit*`, `workspace.status.*`) ne sont traduites qu'en `fr`/`en` | Les 43 autres locales retombent sur `en` ; la traduction demande des relecteurs |
| Copie française hors interface | `app/dev/index.tsx` (10 chaînes), `app/__dev/responsive-preview.tsx` (6) | Atelier de développement, jamais livré |
