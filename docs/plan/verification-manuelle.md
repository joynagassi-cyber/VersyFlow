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
`artifacts/visuel/rapport.md`, et sort en **code 3** si Playwright est absent —
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
