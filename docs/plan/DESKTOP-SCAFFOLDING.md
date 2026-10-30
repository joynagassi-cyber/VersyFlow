# Scaffolding desktop + laboratoire de prévisualisation côte à côte

Document de travail **et** rapport de livraison. Chaque affirmation renvoie à un
fichier du dépôt ou à une sortie de commande.

État : **livré** le 2026-10-30 sur `arena/1faeda0f-versyflow` (scaffolding +
laboratoire + coques d'appareils + tests + rapport).
Reste à faire : voir §7.

---

## 1. Audit du dépôt réel (fait avant toute création de fichier)

| Sujet | Constat vérifié |
|---|---|
| Framework | React **18.3.1**, react-router-**dom 6.28**, Ionic **7**, Vite **6**, TypeScript **5.6** (`package.json`) |
| Build | `vite build` → `www/`, entrée unique `index.html` (`vite.config.ts`), alias `@` → `src`, serveur dev `0.0.0.0:3000`, `allowedHosts: true` |
| Routage | `BrowserRouter` + `<Routes>` déclarés dans `src/main.tsx` (**94** `<Route>`) ; deux layouts : `app/(tabs)/_layout.tsx` (`TabLayout`) et `app/onboarding/_layout.tsx` |
| Écrans | `app/**/*.tsx` — 60 prototypes Stitch mappés (`docs/design/stitch-mapping.md`, généré) |
| Coquille existante | `TabLayout` **mélange** mobile et desktop : il monte `HamburgerMenu` + `BottomTabs` + `QuickDock` + FAB d'un côté, `DesktopRail` de l'autre, et un en-tête réduit à un libellé statique « Espace de travail » |
| Responsive | `src/hooks/useIsDesktop.ts` : deux seuils **768** (`useIsRail`) et **1024** (`useIsDesktop`) ; CSS `--rail`, `.app-main{margin-inline-start:var(--rail)}`, `.desktop-rail`, `.screen-column` (1060 px) / `.screen-column-narrow` (720 px), `--shell-header: 56px` déjà déclarés dans `src/styles/globals.css` |
| Design system | jetons CSS `--color-*` dans `src/styles/globals.css`, presets tweakcn (`src/styles/tweakcn-presets.css`), dégradés, thèmes image ; **un seul écrivain** : `ThemeManager` → `resolveTheme` → `applyThemeToDocument` |
| État / persistance | Zustand ; persistance `localStorage` via `MmkvStorage` (`versyflow-*-storage`, `versyflow:*`) ; données synchronisées via **PowerSync** (`versyflow.db`, IndexedDB/wa-sqlite) |
| Auth | `useAuthStore` (persisté `versyflow-auth-storage`) ; sans session, pas de sync et pas de données famille |
| Outils | `npm run dev` (vite), `npm run build`, `npm run verify` (tsc + eslint + tests design + 4 scripts d'audit), `npm run screens:coverage`, `scripts/visual-check.mjs` (Playwright, absent du sandbox) |

### Point d'entrée retenu

`app/(tabs)/_layout.tsx` : c'est **le** layout qui possède déjà la décision
mobile/desktop. On l'allège pour qu'il délègue à `src/shells/AppShell.tsx`, sans
toucher aux 94 routes ni à un seul écran métier.

### Ce qui manquait réellement

1. Un **en-tête de bureau** : aujourd'hui un simple `<span>Espace de travail</span>`
   sans action globale, sans accès clavier à la recherche, sans état de sync.
2. Une **séparation** entre structure mobile, structure desktop et écrans :
   tout vivait dans le layout de route.
3. Un **panneau secondaire** exploitant la largeur (rien n'existait).
4. Un **espace de prévisualisation** côte à côte (rien n'existait).
5. Un contexte **tablette** explicite (le seuil existait, la notion non).

---

## 2. Plan de scaffolding (fichiers et responsabilités)

### Créés

| Fichier | Responsabilité |
|---|---|
| `src/hooks/useShell.ts` | Trois contextes (`mobile` < 768, `tablet` 768–1023, `desktop` ≥ 1024) à partir des seuils **déjà** définis dans `useIsDesktop.ts`. Aucune nouvelle valeur. |
| `src/shells/shell-context.ts` | Contexte React + `useShellContext()` : un écran sait dans quelle coquille il est, sans refaire de `matchMedia`. |
| `src/shells/MobileShell.tsx` | Coquille mobile : barre de marque + tiroir, contenu, FAB, dock, barre d'onglets, zones sûres. **Reprend à l'identique** le markup mobile existant. |
| `src/shells/DesktopHeader.tsx` | En-tête bureau/tablette : libellé de page réel, barre de commande (recherche, `⌘K`/`Ctrl K`), état de sync, notifications, profil. |
| `src/shells/ReadingPanel.tsx` | Panneau secondaire **fonctionnel** : typographie de lecture (taille, interligne, numéros de versets) branchée sur `appearance-store`. Visible seulement là où il sert (Bible, mémorisation, révisions). |
| `src/shells/DesktopShell.tsx` | Coquille bureau : rail + en-tête + zone principale + panneau secondaire optionnel ; grille en CSS, pas de duplication d'écran. |
| `src/shells/AppShell.tsx` | Aiguillage unique : un seul shell monté à la fois, jamais deux navigations dans le DOM. |
| `preview-frame.html` | Page hôte **dev uniquement** des iframes : installe un `localStorage` en mémoire (isolation) avant tout module, puis charge `/src/main.tsx`. |
| `src/dev/preview-session.ts` | Rôle de la frame, jeu de démonstration déterministe, chemin initial, pont `postMessage` (navigation, thème, rechargement). |
| `src/dev/preview-screens.ts` | Catalogue des écrans proposés au laboratoire (route réelle + statut + ce qui manque). |
| `app/__dev/responsive-preview.tsx` | Laboratoire : deux iframes réelles (390×844 et 1440×900), sélecteur d'écran synchronisé, gel par frame, thème partagé, remise à zéro. |
| `tests/design/app-shells.test.ts` | Vérifie les trois contextes, l'unicité du shell monté, l'absence de duplication d'écrans et de services. |
| `tests/unit/dev/preview-isolation.test.ts` | Vérifie le jeu de démonstration déterministe, l'isolation mémoire et l'absence du laboratoire en production. |
| `src/dev/device-frames.tsx` | Coques d'appareils (téléphone, écran de bureau) autour des aperçus ; `deviceOuterSize()` est une fonction pure. |
| `tests/design/device-cases.test.tsx` | Prouve que chaque aperçu est dans sa coque, que la largeur interne des iframes ne bouge pas et que le décor est masqué aux lecteurs d'écran. |

### Modifiés

| Fichier | Modification |
|---|---|
| `app/(tabs)/_layout.tsx` | Devient un simple `return <AppShell />` (le comportement mobile est déplacé, pas réécrit). |
| `src/main.tsx` | Route du laboratoire **uniquement en DEV** ; au boot, seeding + chemin initial si l'URL porte `?preview=…`. |
| `src/infrastructure/sync/powersync-database.ts` | En prévisualisation, un fichier SQLite **par frame** (`versyflow-preview-mobile.db` / `-desktop.db`) : deux frames ne peuvent pas se disputer la même base. |
| `src/styles/globals.css` | Hauteur d'en-tête, grille bureau, panneau secondaire (jetons existants). |
| `src/i18n/locales/{fr,en}.ts` | Namespace `shell` (fr + en), exigé par le test de parité. |

### Ce qui n'est **pas** fait (et pourquoi)

- Pas de second répertoire d'écrans « desktop » : les 94 routes restent
  partagées. Une adaptation responsive change la **disposition** et la
  **navigation visible**, pas les écrans.
- Pas de `pnpm`, pas de React 19, pas de Vite 8 : la stack installée est
  respectée.
- Pas de nouvelle bibliothèque de composants.

---

## 3. Architecture des coquilles

```
app/(tabs)/_layout.tsx            route layout — 3 lignes
        │
        ▼
src/shells/AppShell.tsx           un seul shell monté
        │
        ├── < 768 px ──────────────► MobileShell
        │     barre de marque + tiroir + Outlet + FAB + dock + onglets
        │
        └── ≥ 768 px ──────────────► DesktopShell
              DesktopRail (existant) + DesktopHeader
              + zone principale (Outlet, .screen-column)
              + ReadingPanel (≥ 1024 px, routes de lecture seulement)
```

- **Mobile ≠ desktop ne veut pas dire deux applications** : les deux montent les
  mêmes `<Outlet />`, donc les mêmes composants d'écran, les mêmes hooks, les
  mêmes services. Ce qui change : la navigation, l'en-tête, la mesure de
  lecture, la présence du panneau.
- Le seuil tablette déplie/replie le rail (`DesktopRail` calcule déjà
  `collapsed = !isDesktop || railMode === 'collapsed'`).
- Aucune duplication de service : `src/shells/**` n'importe **aucun** service
  métier (vérifié par `tests/design/app-shells.test.ts`).

---

## 4. Laboratoire de prévisualisation

**URL** : `/__dev/responsive-preview` (route enregistrée **seulement** si
`import.meta.env.DEV`).

**Isolation par iframe** — c'est le seul mécanisme qui déclenche les vraies
media queries :

| Zone | iframe | viewport réel |
|---|---|---|
| A — mobile | `preview-frame.html?preview=mobile` | **390 × 844** |
| B — desktop | `preview-frame.html?preview=desktop` | **1440 × 900** |

### Coques d'appareils (`src/dev/device-frames.tsx`)

Chaque aperçu est posé dans une coque dessinée en CSS : **téléphone** (bordure
noire, boutons latéraux, îlot, indicateur d'accueil) pour le mobile, **écran de
bureau** (bordure, menton, pied) pour le desktop. La coque est un décor
extérieur, jamais une imitation de la mise en page :

- l'iframe garde **exactement** 390 px / 1440 px de largeur interne (valeur
  posée en style inline, aucune transformation sur l'iframe elle-même) ;
- c'est l'**appareil entier** qui est projeté (`transform: scale(k)`,
  `transformOrigin: top left`) ; une transformation CSS ne modifie pas la
  largeur de mise en page, donc les media queries du produit voient toujours la
  vraie largeur ;
- le conteneur réserve la place **après** projection
  (`deviceOuterSize(...) × k`), sinon la grille du laboratoire serait fausse ;
- l'encoche, l'indicateur d'accueil et le pied sont `aria-hidden` : le décor
  n'est pas annoncé, les iframes le sont (titre explicite).

Dimensions extérieures, calculées par `deviceOuterSize()` (fonction pure donc
testable sans navigateur) :

| Coque | Écran | Ajout | Extérieur |
|---|---|---|---|
| Téléphone | 390 × 844 | bordure 12 px × 2 | **414 × 868** |
| Bureau | 1440 × 900 | bordure 14 px × 2, menton 26, bras 62, semelle 10 | **1468 × 1026** |

Aucune fiche technique de constructeur n'est affichée : seules les dimensions
réellement utilisées le sont.

**Pas de mutation sur un vrai compte** : `preview-frame.html` remplace
`window.localStorage` par un `Storage` en mémoire **avant** le chargement du
moindre module. Chaque frame a donc sa propre copie, jetable au rechargement ;
`MmkvStorage` et les stores Zustand persistés écrivent dedans, jamais dans le
stockage réel. Le rôle est aussi mémorisé dans `window.name`, qui survit à un
rechargement de la frame : même un F5 interne reste isolé.

**Données** : jeu déterministe (`seedPreviewStorage`) — onboarding terminé,
langue `fr`, traduction `lsg`, profil `Léa` + slogan, thème `quantum-rose`,
famille de démonstration `Famille Étoile`. Aucun identifiant de compte réel,
aucune requête réseau, aucune écriture métier.

**Ce que le laboratoire ne synchronise pas** : les saisies, les sessions de
mémorisation et toute mutation métier. Seuls la **route**, le **thème** et le
**rechargement** sont synchronisés — ce sont des commandes de l'espace de
travail, pas des interactions applicatives.

---

## 5. Mode d'emploi du laboratoire

```bash
npm run dev            # vite, http://localhost:3000
# puis ouvrir :
http://localhost:3000/__dev/responsive-preview
```

Dans l'espace de travail :

| Commande | Effet |
|---|---|
| Sélecteur « Écran » | envoie la même route aux **deux** cadres (`vf:preview:navigate`) |
| « gelé » sur un cadre | ce cadre cesse de suivre la sélection, l'autre continue |
| « Recharger les deux » | recharge les deux iframes (`vf:preview:reload`) |
| « Vue de comparaison standard » | dégèle les deux cadres et revient sur `/tabs/home` |
| Changer de thème (réglages ou `/settings/appearance` dans un cadre) | propagé aux deux cadres (`vf:preview:appearance`) |
| Bouton ↗ d'un cadre | ouvre ce cadre seul dans un onglet (plus confortable pour inspecter) |

Chaque cadre annonce son état : `stockage isolé` (ou l'inverse), sa largeur de
viewport interne et la route qu'il affiche réellement.

## 6. Commandes exécutées et résultats

| Commande | Résultat |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | **0 erreur** |
| `npx eslint app src/components src/hooks src/shells src/dev src/store src/theme tests/design tests/unit/dev` | **0 erreur** (les 2 erreurs préexistantes hors périmètre : `bible-json-source.ts`, `fsrs-factory.ts`) |
| `npx vitest run` | **1326 passés · 19 échoués** — exactement les 7 fichiers déjà en échec avant ce travail (jeux bibliques non versionnés, WASM FSRS, `.env`/PowerSync) |
| `npx vitest run tests/design tests/unit/dev` | **143 passés / 143** (dont 16 `app-shells`, 5 `shell-routing`, 4 `preview-lab`, 7 `preview-isolation`) |
| `npm run build` (`vite build`) | **OK** — `www/assets/index-*.js` 447,29 kB (gzip 126,34 kB) |
| `npm run verify` | **exit 0** — audit **17 PASS · 0 PARTIEL · 0 FAIL · 4 non vérifiables** |
| `npm run plan:audit` | C09 (une seule navigation montée) et C11 rétablis après le déplacement du code |
| `npm run screens:coverage` | **60/60** prototypes couverts |

### Isolation de production — mesurée sur le bundle

```text
chunks contenant "responsive-preview" : 0
chunks contenant "preview-frame"      : 0
chunks contenant "vf:preview"         : 0
www/preview-frame.html                : absent
```

Le seul résidu est `window.__VF_PREVIEW_ROLE__`, lu par le nom de fichier
SQLite (une propriété absente en production ⇒ `versyflow.db`, valeur
d'origine). Aucun outil, aucune route, aucune iframe n'est livrée.

### Serveur de développement

```text
/                              → 200
/__dev/responsive-preview      → 200
/preview-frame.html            → 200
/bible/explorer                → 200
```

Les modules `src/shells/AppShell.tsx`, `src/shells/DesktopShell.tsx`,
`src/dev/preview-session.ts` et `app/__dev/responsive-preview.tsx` sont
transformés sans erreur par Vite, et `preview-frame.html` reçoit bien le
préambule React Refresh injecté par Vite (donc le HMR fonctionne dans les
cadres).

### Inspection aux largeurs demandées (390 / 768 / 1024 / 1440 px)

Ce qui est **prouvé** (tests de comportement, jsdom) :

| Largeur | Ce qui est monté | Vérifié par |
|---|---|---|
| 390 | `MobileShell` : barre basse, tiroir, FAB — **aucun** `.desktop-rail`, aucun bouton recherche | `shell-routing.test.tsx` |
| 768 | `DesktopShell` : rail (`<aside>`) + en-tête, **une seule** navigation principale, pas de tiroir | idem |
| 1440 | `DesktopShell` + actions globales (recherche, notifications) et **pas** de FAB mobile | idem |
| 1024 | seuil de colonne de lecture et du panneau secondaire (CSS + `isDesktop`) | `desktop-shell.test.ts`, `app-shells.test.ts` |

Ce qui **n'est pas prouvé ici** : le rendu pixel, l'absence de débordement
horizontal et le rendu du verre dans un vrai navigateur (U01–U04 restent non
vérifiables dans cet environnement, voir `verification-manuelle.md`).

---

## 7. Limites connues et travaux restants

- Aucun navigateur dans l'environnement d'exécution : le rendu **pixel** des
  deux frames n'est pas prouvé ici. Ce qui est prouvé : la route existe, les
  fichiers sont servis, l'isolation est testée en unitaire, le build ne contient
  pas le laboratoire.
- Les jeux bibliques multi-traductions sont absents du poste (données non
  versionnées) : le lecteur Bible affiche son état réel (vide), pas une maquette.
- Les données de mémorisation passent par PowerSync (wa-sqlite) : en
  prévisualisation, une base par frame est utilisée, donc les compteurs
  démarrent vides — état réel, pas simulé.
- Le panneau secondaire n'est branché que sur les routes de lecture. Les autres
  panneaux possibles (détail d'un concept, activité d'un membre) demanderont un
  écran qui accepte la largeur — non fait volontairement : un panneau vide
  serait une décoration.
- La bascule de coquille au redimensionnement est testée par construction
  (`matchMedia` + `useSyncExternalStore`-like abonnement de `useMediaQuery`),
  mais l'animation de transition n'a pas été observée dans un navigateur.
- `scripts/visual-check.mjs` reste la seule voie pour capturer les largeurs
  390 / 768 / 1024 / 1440 px : il exige Playwright, absent de cet
  environnement (sortie en code 3).
