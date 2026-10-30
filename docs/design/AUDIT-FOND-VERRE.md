# Audit — fond image, verre dépoli, jetons, responsive, accents, pluriels

**Étape 0 du contrat. Lecture seule : aucun fichier de l'application n'a été modifié.**
Branche `arena/1faeda0f-versyflow`, HEAD `91d3ed4`, `main` = `664b488`.
Date de l'audit : 2026-10-30.

Convention de lecture utilisée partout : **FAIT** = vérifié dans le dépôt ou `node_modules` ;
**PARTIEL** = vérifié sur une partie du périmètre ; **NON VÉRIFIÉ** = impossible à établir ici.

---

## 0. Limite majeure de cet audit (à lire avant tout)

| Élément du contrat | État ici |
| --- | --- |
| Script console d'inventaire des fonds opaques (exécuté **dans l'app**) | **NON EXÉCUTABLE** — aucun navigateur, aucun Playwright dans cet environnement (`scripts/visual-check.mjs` sort en code 3) |
| Captures 390 / 768 / 1280, clair et sombre | **NON EXÉCUTABLES** — aucun rendu pixel possible |
| Mesures de contraste sur le rendu réel | **NON EXÉCUTABLES** ; seules des valeurs de jetons déclarés sont mesurables (calcul hors navigateur possible en É3) |
| `getComputedStyle` avant/après changement d'image (avenant) | **NON EXÉCUTABLE** ; l'avenant exige une preuve par diff calculé — elle devra être produite sur la machine de l'utilisateur, ou je fournis le script prêt à coller |

Conséquence : tout ce qui suit est un audit **statique** (lecture du code, du CSS et de `node_modules`).
Aucune affirmation de cet audit ne porte sur ce que l'écran affiche réellement.

---

## 1. Versions (FAIT — lues dans `package.json` et `node_modules`)

| Dépendance | `package.json` | Installé |
| --- | --- | --- |
| `@ionic/react` | `^7.0.0` | **7.8.6** |
| `@ionic/react-router` | `^7.0.0` | 7.x (idem) |
| `react` | `18.3.1` | 18.3.1 |
| `i18next` | `^24.0.0` | 24.x |
| `react-i18next` | `^15.0.0` | 15.x |
| `i18next-browser-languagedetector` | `^8.2.1` | 8.2.1 |
| `tailwindcss` | `3.4.17` | 3.4.17 (**v3**, pas v4) |
| `@capacitor/*` | 8.x | 8.x |

**FAIT — le projet n'est pas en shadcn/Tailwind v4** : les blocs copiés d'une plateforme v4
(`@theme`, `color-mix` de tokens `--color-*` v4) doivent être traduits.

---

## 2. Composants Ionic réellement utilisés (FAIT — `grep` sur `app/` + `src/`, `*.tsx`)

| Composant | Occurrences réelles | Remarque |
| --- | --- | --- |
| `IonApp` | 1 | `src/main.tsx` |
| `IonPage` | 4 | `app/onboarding/_layout.tsx`, `src/components/layout/FullScreenPage.tsx` |
| `IonContent` | 1 | `src/components/ui/Primitives.tsx:634` (via `ScrollView`) |
| `IonHeader` / `IonToolbar` | 1 / 1 | même fichier |
| `IonButton` | 1 | — |
| `IonTabs` | **0** | la navigation est faite maison |
| `IonTabButton` | **0** | idem |
| `IonTabBar` | **0 réel** | la seule correspondance est un **commentaire** dans `src/components/navigation/BottomTabs.tsx:4` (« Replaces the Ionic `<IonTabBar>` ») |
| `IonRouterOutlet` | **0** | routage `react-router-dom` |
| `IonCard` | **0** | les cartes sont des `div` Tailwind |

**Conséquence directe sur le contrat** : les règles `ion-tab-bar { --background: var(--glass) }`
et `ion-router-outlet { … }` demandées en É1/É3 ne s'appliquent à **rien** dans cette app.
La « barre d'onglets basse » à passer en verre est `src/components/navigation/BottomTabs.tsx`
(un `<nav>` Tailwind). Il faudra écrire l'équivalent sur `.bottom-tabs` / la classe réelle,
et garder les sélecteurs Ionic en garde-fou (ils sont inertes, ils ne cassent rien).
Décision à valider : je cible **la vraie barre** (sinon le contrat ne produit aucun effet visible).

---

## 3. CSS global et couche de fond existante (FAIT)

Imports de `src/main.tsx` (lignes 15–18), dans cet ordre :

```
@/styles/globals.css
@/styles/tweakcn-presets.css
@/styles/vendored-themes.css
@/styles/gradients.css
```

- **Aucun import `@ionic/react/css/*`** dans `src/main.tsx`, et **aucune** occurrence de
  `@ionic/react/css` dans tout le dépôt (`src`, `app`, `index.html`, `vite.config.ts`).
  Les styles Ionic viennent du Shadow DOM des composants + des variables `--ion-*`.
- **Aucun fichier de palette sombre Ionic** dans l'installation :
  `node_modules/@ionic/react/css/palettes/` **n'existe pas** et `find node_modules/@ionic -name "dark*.css"`
  ne retourne rien. **La palette sombre du contrat (« palette sombre importée ») n'existe donc pas
  ici** : le sombre est assuré par les jetons maison `[data-theme='dark']`
  (`globals.css:61`, `:74`, `:587`, `:626`) et le mapping `--ion-background-color` / `--ion-text-color`
  (`globals.css:619-631`).

### La couche de fond actuelle (le cœur du problème)

`src/styles/globals.css`, bloc `@layer base` :

| Ligne | Règle | Effet |
| --- | --- | --- |
| 111–116 | `html { height:100%; overflow:hidden }` | pas de scroll racine (voulu) |
| 118–130 | `body { background-color: var(--color-background) }` (l.124) | **fond opaque** `#fbf9f9` (clair, l.23) / `#121212` (sombre, l.74) |
| 129–131 | `#root { height:100% }` | aucune couleur |
| 148–164 | `html::before { position:fixed; inset:-4%; background-image: var(--theme-image, none); opacity:0; filter: blur(32px); transform: scale(1.12) }` | couche image, **invisible par défaut** (`opacity: 0`) |
| 165–167 | `html[data-theme-image='on']::before { opacity: .94 }` (l.166) | ne s'active que si un thème-image est choisi |
| 169–172 | `html[data-theme='dark'][data-theme-image='on']::before { filter: blur(32px) invert(.85) hue-rotate(180deg) }` | **voir §6** |
| 178–186 | `@media (min-width:1024px)` → `blur(22px)`, `scale(1.06)` | idem, moins flou sur bureau |
| 640–646 | `html[data-app-bg='gradient']::before { opacity:1; filter:none; transform:none }` | variante dégradé |
| 648–651 | `html[data-app-bg='gradient'] body, html[data-theme-image='on'] body { background-color: transparent }` | **le `body` n'est transparent QUE dans ces deux modes** |
| 747–757 | `.app-canvas` et `[class*='bg-background']` transparents dans ces deux modes | rattrapage partiel |

**FAIT** : hors mode « image » ou « dégradé », `body` est **opaque** et `html::before` a `opacity: 0`.
Une image de fond ne peut donc **jamais** être vue par défaut, et même en mode image elle est
posée **derrière** un `body` rendu transparent seulement dans ce mode précis.

### Surfaces opaques à traiter pour le verre (FAIT — comptage statique)

| Motif | Occurrences (`app/` + `src/`, `*.tsx`) | Jeton |
| --- | --- | --- |
| `bg-surface-tint` | 231 | `#f5f3f3` clair / `#1c1c1c` sombre (opaque) |
| `bg-surface` | 188 (+13 avec `/opacity`, +7 `bg-surface-tint/…`) | `#ffffff` / `#1e1e1e` (opaque) |
| `bg-background` | 28 | `#fbf9f9` / `#121212` (opaque) |
| `bg-card` | 2 | — |
| `.bible-card` (CSS) | `globals.css:590` | carte avec image |
| barre d'onglets | `BottomTabs.tsx:37` : `border-t border-border bg-surface/95 backdrop-blur` | **déjà un verre à 95 %**, donc quasi opaque |

Ce sont **ces 450+ occurrences** (et non `ion-card`) qui déterminent si le fond se voit.
Le contrat prévoit `.glass` ; il faudra soit une couche CSS qui cible ces classes,
soit un remplacement `bg-surface` → `.glass` (plus intrusif). **Décision à valider en É3** ;
proposition par défaut : CSS global, pas de réécriture de composant.

---

## 4. Bibliothèque de traduction (FAIT)

- `i18next@24` + `react-i18next@15`, initialisés dans `src/i18n/i18next-init.ts`.
- Options réelles (l.164–180) : `fallbackLng: 'en'`, `defaultNS: 'translation'`,
  `keySeparator: false`, `interpolation: { escapeValue: false }`, `load: 'currentOnly'`,
  détection `['localStorage', 'navigator']`, **aucun cache**.
- **L'interpolation par défaut d'i18next est `{{variable}}`** : `prefix`/`postfix` ne sont pas
  surchargés ⇒ seuls `{{…}}` sont interpolés.
- 45 fichiers de langue dans `src/i18n/locales/`.

---

## 5. Bug des pluriels — cause exacte (FAIT)

Le libellé signalé existe bien, **littéralement** :

```
src/i18n/locales/fr.ts:395   versesMemorized: 'Verset{plural} mémorisé{plural}',
src/i18n/locales/fr.ts:402   recentVerses:   'Verset{plural} récent{plural}',
src/i18n/locales/fr.ts:404   mastered:       'Maîtrisé{plural}',
```

Trois défauts cumulés, tous vérifiés :

1. **`{plural}` n'est jamais fourni par le code.** `grep -rin "plural"` sur `app/` + `src/`
   (hors `locales/`) ne renvoie **aucune** occurrence : ni clé `plural:`, ni variable passée à `t()`.
   Le placeholder reste donc affiché tel quel ⇒ `VERSET{PLURAL} MÉMORISÉ{PLURAL}` (majuscules
   parce que le composant met le libellé en `uppercase`, pas parce que la locale est en capitales).
2. **`{count}` simple accolade n'est pas interpolé** non plus (`{{ }}` requis) :
   `fr.ts:192` `'{count} verset{plural} à réviser'`, `:226`, `:227`, `:245`, `:546`…
   ⇒ affichage littéral `{count} verset…`.
3. **Aucune clé de pluriel i18next.** Il n'existe aucun suffixe `_one` / `_other` dans les locales ;
   `grep -c "PLURAL"` (majuscules) = 0. `app/(tabs)/progress.tsx:87` appelle
   `t('progress.versesMemorized', 'Verset(s) mémorisé(s)')`, et plusieurs écrans passent
   déjà `{ count }` (`app/(tabs)/index.tsx:177,199`, `explore.tsx:59`, `progress.tsx:153`…)
   — donc **le mécanisme de compteur est déjà en place côté appelant**, seule la locale est fausse.

**Ampleur** : 17 occurrences de `{plural}` dans `fr.ts`, et le même motif dans les autres locales
(ex. `am.ts:171`, `ar.ts:60`). La correction É6 devra couvrir **fr au minimum** (0 / 1 / 2 exigés),
et idéalement toutes les locales touchées — je proposerai un périmètre chiffré avant d'agir,
car 45 fichiers × plusieurs clés est un changement large pour un « travail minimal ».

**Syntaxe à utiliser (i18next v24)** : clés `_one` / `_other` (français CLDR :
`one` pour 0 et 1, `other` à partir de 2 ; `many` existe en CLDR récent pour les grands nombres,
à traiter via `Intl.PluralRules('fr')` si l'on veut être exact) + `{{count}}`.
À vérifier en É6 sur la version installée avant d'écrire, pas sur ma mémoire.

---

## 6. Pourquoi le fond ressemble à « une tache bleue » — hypothèses classées

Éléments **mesurés** :

| Fait | Source |
| --- | --- |
| Images de thème : **832×1248** (portrait) et **1248×832** (paysage), **PNG de 605 à 1 092 Ko** | en-tête PNG lu sur `public/themes/animaux/ani-abeille-{portrait,landscape}.png`, `public/themes/natures/nat-cactus-landscape.png` |
| 200 images, `public/themes` = **141 Mo** | `find` + `du -sh` |
| Flou de **32 px** (22 px ≥ 1024 px) sur une image de 1248 px de large | `globals.css:161, 188` |
| Zoom `scale(1.12)` permanent | `globals.css:162` |
| Mode sombre : **`invert(0.85) hue-rotate(180deg)`** | `globals.css:171, 185` |
| Voile d'opacité `.94` sur un `body` opaque | `globals.css:166, 124` |

Classement (du plus probable au moins probable) :

1. **Le flou tue toute lecture (certain).** 32 px de flou sur une image 1248 px de large, puis
   `scale(1.12)` : il ne reste aucune forme, seulement des masses de couleur. C'est la définition
   d'une « tache ».
2. **Le virage bleu vient de l'inversion du mode sombre (très probable).**
   `invert(.85) hue-rotate(180deg)` sur une illustration chaude (ambre/rose/vert) produit
   mécaniquement des bleus-cyan désaturés. C'est **la** signature d'une tache bleue.
3. **L'image est petite pour un écran large (certain sur les chiffres).** 1248 px de large
   pour un viewport de 1440–1920 px ⇒ agrandissement, donc douceur supplémentaire ; et 605–1 092 Ko
   en PNG alors que le contrat exige WebP 200–400 Ko et ≥ 1600 px.
4. **Le fond est de toute façon masqué par défaut (certain).** Hors thème-image / dégradé,
   `body` est opaque et `html::before` a `opacity: 0` : l'utilisateur ne voit alors **aucune** image,
   seulement la couleur de fond. Si ce qu'il voit est « bleu », c'est que le thème actif est un
   thème-image (ou un dégradé) **et** que les points 1–2 s'appliquent.

**Ce qui n'est PAS la cause (écarté)** : un empilement de `!important` (il n'y en a pas dans la
couche de fond), et un `background-attachment: fixed` (aucune occurrence — conforme au contrat).

---

## 7. Ce que l'étape 1 devra toucher (proposition minimale, à valider)

1. Rendre transparents : `html`, `body`, `#root`, `ion-app`, `.ion-page`, `ion-content`
   — **et retirer le garde `[data-app-bg='gradient']` / `[data-theme-image='on']`** qui
   conditionne aujourd'hui la transparence du `body`.
2. **Une seule** couche fixe `html::before` (ou `#app-bg`) : `inset: 0`, `z-index: 0`,
   `center / cover`, flou 0–3 px, `saturate(1.1)`, `scale(1.05)`, voile 0,15 → 0,45.
   La couche existante est déjà `fixed` + `z-index:-1` : il faut la **remplacer**, pas en ajouter une.
3. Contenu en `z-index: 1` au-dessus de la couche.
4. **Supprimer** `invert()/hue-rotate` du mode sombre (remplacés par le voile dégradé).
5. Fournir **une** photo nette ≥ 1600 px, WebP 200–400 Ko, dans `/public` — je n'ai pas de
   photographie sous licence libre dans cet environnement : **soit l'utilisateur la fournit,
   soit je génère une image** (mais une image générée n'est pas une « vraie photo » ; à trancher
   explicitement, je ne le déciderai pas seul).

---

## 8. Points à trancher avant l'étape 1

| # | Question | Proposition par défaut |
| --- | --- | --- |
| A | La barre d'onglets à mettre en verre est le `<nav>` maison (`BottomTabs.tsx`), pas `ion-tab-bar` (inexistant). Je cible le vrai composant ? | oui, + garde-fou `ion-tab-bar` inerte |
| B | Les 450+ classes `bg-surface*` : verre global par CSS, ou remplacement classe par classe ? | CSS global, zéro réécriture de composant |
| C | Image de fond : fournie par vous, ou générée par moi (et alors ce ne sera pas une photo) ? | à vous de choisir |
| D | Périmètre du correctif pluriels : `fr` seule, ou toutes les locales touchées par `{plural}` ? | `fr` + `en` en É6, autres locales signalées |

**Aucune modification n'a été faite. J'attends votre validation de ce rapport pour l'étape 1.**
