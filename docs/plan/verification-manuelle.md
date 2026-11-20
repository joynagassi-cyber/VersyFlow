# Vérification manuelle — les 4 points que je ne peux pas prouver

L'audit `node scripts/audit-plan.mjs` rend **17 PASS · 0 PARTIEL · 0 FAIL · 4 non vérifiables**.
Ces 4 points (U01–U04) ne sont pas « en cours » : ils sont **hors de portée de
l'environnement de développement** — pas de navigateur, pas de moteur de mise en
page, jeux bibliques non versionnés. Ce document existe pour qu'ils ne restent
pas une case grise : il décrit exactement quoi regarder, dans quel ordre, et
comment noter le résultat.

> Règle du plan : un point n'est **JAMAIS** compté comme réussi parce qu'il n'a
> pas pu être mesuré. Tant que vous n'avez pas coché, il reste « non vérifié ».

---

## 0. Ouvrir l'application

Deux façons, au choix :

| Voie | Commande | Usage |
| --- | --- | --- |
| Aperçu servi (build de production) | `npm run build && npm start` puis `http://localhost:3000` | le plus proche du rendu livré |
| Développement | `npm run dev` puis `http://localhost:3000` | rechargement à chaud, pour corriger |

Les largeurs de référence du contrat : **390** (mobile), **768** (rail
apparaît), **1024** (rail dépliable), **1440** (bureau large).

### Automatisation possible (recommandée)

`scripts/visual-check.mjs` fait les captures et **mesure** le débordement
horizontal à votre place :

```bash
npm i -D playwright
npx playwright install chromium
node scripts/visual-check.mjs --base http://localhost:3000
```

Il écrit `artifacts/visuel/<largeur>/<écran>.png` et
`artifacts/visuel/rapport.md` (ou `docs/screenshots/` avec `--out`), et sort en
**code 3** si Playwright est absent —
c'est-à-dire « rien mesuré », jamais « tout va bien ». Code **1** = au moins un
écran déborde ou lève une erreur console.

---

## 1. U01 — rendu visuel réel aux 4 largeurs

À faire une fois par largeur, sur les 12 écrans de `DEFAULT_ROUTES`
(`scripts/visual-check.mjs` liste les mêmes).

**Procédure** : ouvrir chaque écran, redimensionner à la largeur indiquée,
constater :

| Largeur | Ce qui doit changer | Ce qui ne doit **pas** arriver |
| --- | --- | --- |
| 390 | barre d'onglets basse visible, contenu en une colonne | colonne plus large que l'écran, texte coupé |
| 768 | **rail de navigation replié** (88 px) à gauche, barre d'onglets **disparue** | les deux navigations visibles en même temps |
| 1024 | rail **dépliable** (264 px), contenu centré en colonne de lecture | contenu collé au rail, largeur qui saute |
| 1440 | même coquille que 1024, marges qui grandissent, jamais le texte | lignes de lecture de 1400 px de large |

**Cocher** : ☐ 390 ☐ 768 ☐ 1024 ☐ 1440

---

## 2. U02 — débordement horizontal et positions réelles

Le script mesure `document.documentElement.scrollWidth − clientWidth` : la
valeur doit être **≤ 0** partout. À la main, l'équivalent est :

1. Sur chaque écran, pousser le scroll horizontalement (touareg/`shift+molette`) :
   rien ne doit bouger latéralement.
2. Vérifier les zones à risque connues : bandeau de statistiques
   (`/tabs/home`, `/progress`), grille de thèmes (`/settings/appearance`),
   barre d'actions du verset (`/bible/explorer`), panneau de comparaison
   (`/comparison/translation`).
3. Ouvrir une feuille modale (ex. sélecteur de langue dans `/tabs/settings`) :
   < 768 px → tiroir bas plein écran ; ≥ 768 px → boîte centrée ≤ 680 px.

**Cocher** : ☐ aucun débordement ☐ modale conforme aux deux paliers

---

## 3. U03 — effet réel du verre (`backdrop-filter`)

Le CSS est prouvé (C06 : `40 %` + `40 px` + voile, consommé par
`.surface-glass`). Ce qui reste à voir est la **composition** à l'écran :

1. Choisir un thème **image** dans `/settings/appearance`.
2. Revenir à `/tabs/home` : les cartes qui portent `.surface-glass` doivent
   laisser deviner l'image derrière elles, sans lisibilité dégradée.
3. Vérifier que le texte reste lisible sur les 4 largeurs (contraste réel,
   pas seulement calculé).
4. Activer « transparence réduite » (même écran) : l'effet doit se retirer.

**Cocher** : ☐ verre perceptible ☐ texte lisible ☐ transparence réduite effective

---

## 4. U04 — parcours métier sur données réelles

Le parcours mémorisation → révision ne peut pas être joué jusqu'au bout ici :
les jeux bibliques multi-traductions ne sont pas versionnés (décision
d'allègement). Ils sont dans l'historique Git, pas perdus.

**Restaurer les données sur votre poste** (elles restent ignorées par Git) :

```bash
# dernier commit de main qui les contenait, avant la fusion de la PR #3
git checkout <sha-avant-fusion> -- data/bible
# ou, depuis GitHub, fichier par fichier :
gh api 'repos/<owner>/VersyFlow/contents/data/bible?ref=<sha>' --jq '.[].name'
```

**Parcours à jouer**, dans cet ordre :

| Étape | Écran | Attendu |
| --- | --- | --- |
| 1 | `/bible/explorer` | la liste des livres se remplit depuis la traduction active |
| 2 | un chapitre, puis un verset | le texte s'affiche, l'action « mémoriser » est proposée |
| 3 | `/memorization/session` | les mots se révèlent un par un, le compteur avance |
| 4 | notation (À revoir / Difficile / Bon / Facile) | le rating est **enregistré avant** la navigation |
| 5 | `/review/queue` | le verset revient avec sa prochaine échéance FSRS |
| 6 | rechargement de la page (F5) | progression et réglages **conservés** |

**Cocher** : ☐ 1 ☐ 2 ☐ 3 ☐ 4 ☐ 5 ☐ 6

---

## 5. Journal des résultats

| ID | Ce que ça prouve | État | Date / note |
| --- | --- | --- | --- |
| U01 | mise en page aux 4 largeurs | ☐ non vérifié | |
| U02 | pas de débordement, modales conformes | ☐ non vérifié | |
| U03 | verre réel + lisibilité | ☐ non vérifié | |
| U04 | parcours mémorisation / révision sur données réelles | ☐ non vérifié | |

Quand une ligne est cochée, reporter la mention dans
`docs/plan/PLAN-INTERFACE-WEB.md` (§ « Définition de fini », ligne 8) et dans
`docs/plan/audit-report.md` : la case passe de « non vérifiable » à « vérifié
le <date> par <qui> », avec la capture ou le rapport
`artifacts/visuel/rapport.md` comme pièce jointe.

---

## 6. Playbook 2026 — les 7 points qui demandent un appareil ou un navigateur

`node scripts/audit-playbook.mjs` rend **47 vérifiés · 7 partiels · 0 en échec ·
23 non vérifiables** sur les 77 règles. Les 30 points restants ont la même
cause : ils demandent un **rendu réel**. Ce qui suit est la version « à la
main » des 7 partiels — les 23 non vérifiables (C03, D04–D07, F02, F04, H05,
I05, J02–J14, K03) sont des points de plateforme qui n'existent pas encore dans
ce dépôt (pas d'empaquetage Windows/macOS/Linux, pas d'appareil).

### 6.1 C02 — le texte tient à 200 % (zoom navigateur)

Zoom autorisé (`maximum-scale=5`, `user-scalable` retiré). À vérifier :

1. `Ctrl`/`Cmd` `+` jusqu'à **200 %** sur `/bible/explorer`, verset ouvert.
2. Rien ne se perd : le texte se replie, aucun mot tronqué, aucun
   défilement horizontal (§2).
3. La barre d'onglets basse reste atteignable — si elle recouvre le texte,
   c'est un échec, pas une gêne.
4. Refaire avec la **taille de police du système** à 200 % (C03), qui n'est
   pas la même chose.

**Cocher** : ☐ 200 % sans perte ☐ sans défilement horizontal

### 6.2 D02 / D03 — zones de touche iOS 44 pt et Android 48 dp

Le jeton est posé : `--tap-min` vaut **40 px** au repos, **44 px** sous
`pointer: coarse` (iOS) et **48 px** sous `html[data-platform='android']`.
Aucun `data-platform` n'est posé aujourd'hui : sur Android, c'est donc 44 px
qui s'applique, pas 48.

1. Sur iPhone, mesurer au moins : chevron de retour, croix de dialogue,
   bouton de note (1–4) de `/review/queue`, onglets bas.
2. Sur Android, poser `document.documentElement.dataset.platform = 'android'`
   dans la console, puis remesurer les mêmes cibles à 48 dp.
3. Une cible peut être **visuellement** plus petite que sa zone : ce qui
   compte est la zone qui répond au doigt.

**Cocher** : ☐ iOS 44 pt ☐ Android 48 dp

### 6.3 I02 — pas de saut de mise en page (CLS ≤ 0,1)

25 formes de squelette et un repli par famille de route existent. La mesure :

1. Onglet **Performance** de DevTools, réseau « Slow 4G ».
2. Naviguer entre `/tabs/home`, `/progress`, `/review/queue`, un chapitre.
3. Relever **CLS** : ≤ 0,1. La cause la plus fréquente ici serait une image de
   thème sans dimensions réservées.

**Cocher** : ☐ CLS ≤ 0,1 ☐ aucune image sans dimensions

### 6.4 J01 / J05 — encoches et zones sûres

`viewport-fit=cover` + `env(safe-area-inset-*)` sont déclarés. À voir :

1. Android edge-to-edge : la barre d'état ne recouvre pas le titre d'écran,
   la barre de gestes ne recouvre pas les onglets.
2. iOS avec encoche, en portrait **et** en paysage : le lien d'évitement, la
   barre d'onglets et les feuilles modales restent dans la zone sûre.

**Cocher** : ☐ Android edge-to-edge ☐ iOS portrait ☐ iOS paysage

### 6.5 J15 — utilisable de 320 à 1920 px

Aucune largeur fixe > 320 px n'est déclarée (mesuré). Reste le rendu :

| Largeur | Attendu |
| --- | --- |
| 320 | une colonne, texte replié, aucun défilement horizontal |
| 390 | idem + onglets bas confortables |
| 768 | rail replié, onglets bas disparus |
| 1280 | contenu en colonne de lecture, jamais étiré |
| 1920 | marges qui grandissent, pas la ligne de texte |

`scripts/visual-check.mjs` fait ces captures et **mesure** le débordement
(voir §0) : `artifacts/visuel/rapport.md` sert de pièce jointe.

**Cocher** : ☐ 320 ☐ 390 ☐ 768 ☐ 1280 ☐ 1920

---

## 7. Journal — points du playbook

| ID | Ce que ça prouve | État | Date / note |
| --- | --- | --- | --- |
| C02 | texte à 200 % sans perte | ☐ non vérifié | |
| D02 | cible iOS 44 pt | ☐ non vérifié | |
| D03 | cible Android 48 dp | ☐ non vérifié | |
| I02 | CLS ≤ 0,1 | ☐ non vérifié | |
| J01 | edge-to-edge Android | ☐ non vérifié | |
| J05 | zones sûres iOS | ☐ non vérifié | |
| J15 | 320 → 1920 px | ☐ non vérifié | |

Tant qu'une ligne reste vide, elle reste **partielle** dans
`docs/design/PLAYBOOK-AUDIT.md` : un point non mesuré n'est jamais compté
comme réussi.
