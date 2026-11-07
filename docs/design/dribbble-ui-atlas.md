# Atlas Dribbble & Plan Séquentiel d’Élévation UI (Mobile 390 px + Desktop 1440 px)

> **Objectif** : élever méthodiquement **les formes, le style des cartes et les composants UI de chaque page** de VersyFlow — sur **mobile (390 px)** comme sur **bureau (1440 px)** — à partir d’une collection curatée de **26 références Dribbble** inspectées visuellement, filtrées selon les invariants du système de design VersyFlow (sobriété mono-accent, contraste WCAG AA ≥ 4,5:1, verre adaptatif `Glass`, icônes Solar duotone, zéro couleur littérale, zéro taille de police arbitraire).

---

## 1. Planches visuelles de référence (dans `docs/artwork/dribbble/`)

Les fichiers bruts de travail sont isolés hors Git dans `/artifacts/dribbble-refs/` (conformément à `.gitignore`), tandis que **8 planches d’étude annotées et compactes** (`~956 Ko` au total) documentent visuellement chaque lot :

| Planche | Fichier | Périmètre couvert |
| --- | --- | --- |
| **Vue d’ensemble** | `docs/artwork/dribbble/atlas-7-lots-overview.jpg` | Synthèse visuelle des 26 références réparties sur les 7 lots |
| **Lot 1** *(Livré)* | `docs/artwork/dribbble/lot-1-socle-accueil.jpg` | Géométrie concentrique, verre stratifié, Bento d’Accueil, Dock mobile & Rail bureau |
| **Lot 2** | `docs/artwork/dribbble/lot-2-bible-lecture.jpg` | Explorateur biblique, grille de chapitres, lecteur éditorial & barre flottante |
| **Lot 3** | `docs/artwork/dribbble/lot-3-memorisation-fsrs.jpg` | Flashcards empilées tactiles, masquage/écriture & file/session FSRS |
| **Lot 4** | `docs/artwork/dribbble/lot-4-progression-analytique.jpg` | Cartes KPI Bento, anneaux radiaux, calendrier de série & maîtrise |
| **Lot 5** | `docs/artwork/dribbble/lot-5-famille-communaute.jpg` | Hub Famille, podium/classement épuré, défis & fil d’activité |
| **Lot 6** | `docs/artwork/dribbble/lot-6-semantique-graphe.jpg` | Graphe de connaissances, fiches concepts, capsules de tags & notes |
| **Lot 7** | `docs/artwork/dribbble/lot-7-onboarding-profil-reglages.jpg` | Onboarding coupé bureau / mobile calme, carte Profil & studio Apparence |

---

## 2. Principes géométriques & matériels extraits de Dribbble (adaptés à VersyFlow)

1. **Rayons concentriques (`R_externe = R_interne + espacement`)** *(réf. `lot1-01` MengTo Design System, `lot1-02` Controlly)* :
   - Carte héro `.g3` : **`28 px`** (`--radius-card-hero`) ;
   - Carte standard `.g1` / `.g2` : **`24 px`** (`--radius-card`) ;
   - Puits / sous-surface interne `.bento-inset` : **`16 px`** (`--radius-card-inner`) ;
   - Boutons d’action principaux/secondaires & badges d’état `.pill-badge` : **`999 px`** (`--radius-pill`, vraies capsules).
2. **Profondeur stratifiée sans surcharge chromatique (`Sobriété`)** :
   - Au lieu d’ajouter des couleurs décoratives interdites par `AVENANT-SOBRIETE.md`, la hiérarchie interne d’une carte naît d’un **puits subtil `.bento-inset`** (`color-mix(in srgb, var(--tx) 5%, transparent)` + liseré `9 %` + filet spéculaire supérieur `--hi`) et de **capsules `.pill-badge` / `.pill-badge-accent`**.
3. **Double ergonomie native Mobile (390 px) vs Bureau (1440 px)** :
   - **Mobile (`< 700 px`)** : grilles Bento asymétriques **`2 + 1`** (évitant les 3 colonnes étroites de `106 px` qui écrasent les libellés français), cibles tactiles `≥ 40–44 px`, dock flottant centré (`max-width: 460px`).
   - **Bureau (`≥ 1100 px`)** : alignement bas-à-bas des cartes jumelles (`margin-top: auto` sur les pieds de carte), rail latéral flottant repliable (`264 px` / `88 px`), grilles 3 et 4 colonnes équilibrées.

---

## 3. Découpage séquentiel complet des 88 écrans (Lots 1 → 7)

### LOT 1 — Socle Géométrique, Navigation & Tableau de Bord d’Accueil ✅ *(Livré dans cette passe)*
- **Références Dribbble** :
  - `lot1-01` — *Translucent Glass & Concentric Card System* (`https://dribbble.com/MengTo`) : rayons concentriques `28 / 24 / 16 / 999 px`, filet spéculaire supérieur, sous-panneaux imbriqués.
  - `lot1-02` — *Controlly Glassmorphic Bento & Floating Dock* (`https://dribbble.com/search/glassmorphism-card-ui`) : puits internes sur verre sombre/clair, dock mobile resserré.
  - `lot1-03` — *Daily Devotion Focal Card & Streak Capsules* (`https://dribbble.com/tags/devotion`) : vignette d’illustration encadrée dans la carte du verset du jour + capsules d’état en en-tête.
  - `lot1-04` — *Dual-State Sidebar Navigation* (`https://dribbble.com/tags/dashboard-sidebar`) : pastille active nette dans le rail bureau.
- **Écrans & composants couverts** :
  - `src/styles/globals.css` (`.bento-inset`, `.pill-badge`, `.pill-badge-accent`, variables `--radius-card-*`, `.mobile-tabs`, `.desktop-rail`)
  - `src/components/ui/card.tsx`
  - `app/(tabs)/index.tsx` (**Accueil** — Mobile `390 px` & Bureau `1440 px`) :
    - En-tête `.home-greeting` restructuré sans collision de bouton absolu sur mobile + capsules d’état (famille active, accès direct aux révisions dues) ;
    - Carte héro `.home-daily-card` enrichie d’un en-tête éditorial (`.pill-badge-accent` + miniature d’art encadrée `.home-daily-art` révélant nettement le thème sacré/photo choisi tout en gardant le voile `90 %` conforme WCAG AA sous le texte) + boutons capsules `999 px` ;
    - Carte `.home-streak` structurée avec puits `.bento-inset` pour l’anneau radial et dock hebdomadaire 7 jours aligné en bas avec la carte héro sur bureau ;
    - Grille `.home-stats` en **Bento `2 + 1` sur mobile** (la tuile *Révisions à faire* occupe toute la largeur en barre horizontale interactive) et **3 colonnes icône + chiffre serif tabulaire sur bureau** ;
    - En-têtes de section éditoriaux `.home-section-head` (remplaçant les `<h2>` enfermés dans des boîtes `.g1` isolées), cartes d’actions rapides avec micro-flèche directionnelle au survol, et cartes « Récemment mémorisés » à 3 zones alignées + `<EmptyState tone="inline">` actionnable.

---

### LOT 2 — Explorateur Biblique, Grille de Chapitres & Lecteur Éditorial *(Prochaine étape)*
- **Références Dribbble** :
  - `lot2-01` — *Faithbase Bible Reader & Highlight Sheet* (`https://dribbble.com/search/bible-app`) : grille numérique de chapitres en tuiles tactiles carrées-arrondies, feuille flottante d’actions sur versets sélectionnés.
  - `lot2-02` — *Amen 3.0 Verse Typography* (`https://dribbble.com/tags/devotion`) : respiration typographique autour du texte sacré.
  - `lot2-03` & `lot2-04` — *Book App & BookWorms Desktop/Mobile Reader* (`https://dribbble.com/tags/book-reading-app`) : sélecteur Ancien / Nouveau Testament par segments capsules, vue divisée bureau (navigation chapitres + manuscrit).
- **Pages ciblées (10 routes)** :
  - `app/(tabs)/explore.tsx`, `app/bible/explorer.tsx`, `app/bible/book.tsx`, `app/bible/chapter.tsx`, `app/comparison/translation.tsx`, `app/comparison/result.tsx`, `app/search/index.tsx`, `app/collections/index.tsx`, `app/notes.tsx`, `src/components/bible/{ContinuousBibleReader,ManuscriptView,VerseActionBar}.tsx`.
- **Améliorations prévues (Mobile + Desktop)** :
  - Sélecteur segmenté en capsule (`Tous · Ancien Testament · Nouveau Testament`) en haut de l’Explorateur ;
  - Tuiles de livres avec badge du nombre de chapitres en `.pill-badge` ;
  - Grille de chapitres tactile harmonisée (`aspect-square`, rayon `14 px`) dans `book.tsx` ;
  - Barre flottante `VerseActionBar` affinée en dock capsule `Glass` sur mobile et barre contextuelle ancrée sur bureau.

---

### LOT 3 — Mémorisation Active, Flashcards Empilées & Sessions FSRS
- **Références Dribbble** :
  - `lot3-01` — *Anki Tactile Stacked Card & Interval Pills* (`https://dribbble.com/search/spaced-repetition`) : effet de pile de cartes (2 tranches subtiles sous la carte active) + 4 capsules d’intervalles FSRS en pied d’écran.
  - `lot3-02`, `lot3-03`, `lot3-04` — *Spaced Repetition Study Decks Mobile & Desktop* (`https://dribbble.com/lindiebotes`) : barre de progression de séance segmentée, états recto/verso nets, bilan de fin de session célébratoire mais sobre.
- **Pages ciblées (12 routes)** :
  - `app/memorization/{workspace,session,flashcard,confirm}.tsx`, `app/memory/{start,flashcard,recall-writing}.tsx`, `app/review/{queue,session,summary,calendar,History}.tsx`, `src/components/memorization/*`, `src/components/ui/RatingBar.tsx`.
- **Améliorations prévues (Mobile + Desktop)** :
  - Profondeur de paquet de cartes (`.flashcard-stack`) sous la carte d’étude ;
  - `RatingBar` en 4 capsules tactiles avec intervalle estimé au-dessus du libellé ;
  - File de révision (`queue.tsx`) groupée par urgence dans des conteneurs Bento sur bureau (colonne file + colonne aperçu/statut).

---

### LOT 4 — Progression, Maîtrise, Calendrier & Analytique Bento
- **Références Dribbble** :
  - `lot4-01` & `lot4-02` — *Bento KPI Rings & Luxeraphic Dark Bento* (`https://dribbble.com/tags/bento-grids`) : hiérarchie KPI + jauge circulaire + barres comparatives dans des puits `.bento-inset`.
  - `lot4-03` & `lot4-04` — *HBIT Mobile Habit Stats & Desktop Habit Panel* (`https://dribbble.com/tags/habit-tracker-app`) : heatmap/calendrier de régularité et jalons de maîtrise.
- **Pages ciblées (4 routes)** :
  - `app/(tabs)/progress.tsx`, `app/analytics/dashboard.tsx`, `app/mastery/index.tsx`, `app/achievements/index.tsx`.
- **Améliorations prévues (Mobile + Desktop)** :
  - Grille `2×2` Bento compacte sur mobile et `4` colonnes sur bureau avec `.bento-inset` pour la comparaison *Cette semaine vs Semaine dernière* ;
  - Anneau de maîtrise associé à la barre de répartition (*Maîtrisés · En cours · À réviser*) ;
  - Cartes de trophées (`achievements`) en médaillons duotone sobres sans couleurs criardes.

---

### LOT 5 — Espace Famille, Défis, Classement & Fil d’Activité
- **Références Dribbble** :
  - `lot5-01`, `lot5-02`, `lot5-04` — *Clean Challenge Cards, Podium & Minimal Desktop Leaderboard* (`https://dribbble.com/tags/leaderboard`) : mise en avant sobre du top 3 + lignes tabulaires aérées sur bureau.
  - `lot5-03` — *Dual-Theme Activity Feed* (`https://dribbble.com/tags/activity-feed`) : fil chronologique structuré avec puces de réaction en capsules.
- **Pages ciblées (21 routes)** :
  - `app/family/*` (`home`, `leaderboard`, `activity`, `members`, `member`, `points`, `challenges/*`, `session/*`, `invite`, `join`, `create`, `profile`, `select-profile`, `presentation`, `settings`, `sync`) + `src/components/family/FamilyKit.tsx`.

---

### LOT 6 — Mémoire Sémantique, Graphe de Concepts & Tags
- **Références Dribbble** :
  - `lot6-01` — *Anytype Clean Knowledge Graph* (`https://dribbble.com/tags/knowledge-graph`) : canevas de graphe respirant + panneau latéral de détail sur bureau.
  - `lot6-02` — *Organized Knowledge PKM Cards* (`https://dribbble.com/tags/knowledge_management`) : cartes de concepts reliées par capsules de tags et compteur de versets liés.
- **Pages ciblées (10 routes)** :
  - `app/semantic/{index,tree,community,concept,node,verse,review,suggestions,attach,data}.tsx`, `app/semantic/tags.tsx`, `app/semantic/tags/new.tsx`.

---

### LOT 7 — Onboarding, Profil, Authentification & Studio d’Apparence
- **Références Dribbble** :
  - `lot7-01` — *Untitled UI Appearance Settings* (`https://dribbble.com/search/glassmorphism-dark-mode`) : présentation claire en sections deux colonnes sur bureau (intitulé/explication à gauche, sélecteurs visuels à droite).
  - `lot7-02` & `lot7-04` — *Mobile + Desktop Profile Bento & Twin Cards* (`https://dribbble.com/tags/profile-card`) : bandeau de couverture thématique, avatar cerclé et bandeau de 3 compteurs clés.
  - `lot7-03` — *Responsive Split Desktop + Mobile Onboarding* (`https://dribbble.com/search/desktop-onboarding`) : cadre visuel illustré à gauche + carte d’étape épurée à droite sur bureau, carte plein cadre centrée sur mobile.
- **Pages ciblées (25 routes)** :
  - `app/onboarding/*`, `app/profile/*`, `app/(tabs)/auth/*`, `app/(tabs)/settings.tsx`, `app/settings/*`, `app/notifications.tsx`, `app/splash.tsx`.
