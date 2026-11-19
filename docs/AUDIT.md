# VersyFlow — état mesuré du dépôt

> **Ce document est la référence courte de l'état réel.** Il cite la source de
> chaque affirmation (fichier, commande) au lieu de la décrire. Les documents
> antérieurs à novembre 2026 qui parlent encore d'un backend, d'un magasin
> distant ou d'une synchronisation multi-appareils sont **datés** : ils portent
> un bandeau et vivent dans `docs/` (ou `archive/`), ils décrivent l'histoire du
> projet, pas son architecture actuelle.

Dernière mesure : **2026-11-19**, branche `arena/943d471f-versyflow`.

---

## 1. Ce qu'est l'application, en une phrase

Une application **100 % frontend** (React 18 + Vite + Ionic shell + Tailwind)
de mémorisation biblique par répétition espacée FSRS : tout l'état vit sur
l'appareil, les données bibliques sont livrées avec le build, aucun appel
réseau n'est nécessaire pour mémoriser, réviser ou lire.

## 2. Ce qui a été retiré, et pourquoi

| Retiré | Preuve de la suppression |
| --- | --- |
| Service cloud : authentification, base, stockage | `tests/design/no-cloud-backend.test.ts` échoue si le nom réapparaît hors `docs/DECISIONS.md` |
| Synchronisation hors ligne du même service | même garde-fou |
| 39 fichiers liés à ce service, 16 tests et scripts | commit `24c8ce2` (`git show --stat`) |
| `.amazonq/`, `.kiro/`, `graphify-out/` (3 571 fichiers) | décision D6, `docs/DECISIONS.md` |

Toutes les fonctionnalités qui passaient par ces services fonctionnent sur le
stockage local : la mémorisation perd la synchronisation multi-appareils, pas
son fonctionnement (décision D1).

## 3. Routes : une seule URL par écran

Le routeur effectif est `src/main.tsx` (**99 routes** mesurées par
`node scripts/screen-coverage.mjs`). Quatre doublons ont été supprimés ; les
anciennes URL restent valides et **redirigent** :

| Ancienne URL | Destination unique | Pourquoi |
| --- | --- | --- |
| `/bible/book/:bookId` | `/bible/explorer/:bookId` | troisième implémentation du même parcours |
| `/bible/chapter/:bookId/:n` (+ query `book`/`chapter`) | `/bible/explorer/:bookId/:n` | autre lecteur, autres paramètres |
| `/memory/start` | `/memorization/start` | exigeait un `state` de routeur qu'aucun écran ne fournissait |
| `/family/select-profile` | `/profile/select` | deux sélecteurs pour un seul geste |

Ce qui reste volontairement distinct : `memorization/*` conduit la session et
l'atelier de méthode ; `memory/*` porte les deux exercices ciblés
(`flashcard`, `recall-writing`). Ce ne sont pas deux implémentations du même
écran : ce sont deux rôles.

Un **seul** hub de réglages : `/settings`. L'onglet `/tabs/settings` garde la
langue, session & rappels et la zone de danger, et renvoie au hub pour le reste
au lieu de le recopier.

## 4. Bible : une seule traduction, un chargement par chapitre

Décisions D2 et D3 (motifs complets dans `docs/DECISIONS.md`).

| Niveau | Fichier | Poids | Chargé quand |
| --- | --- | --- | --- |
| Structure | `public/data/bible/lsg/index.json` | 37 Ko | toujours |
| Chapitre | `public/data/bible/lsg/<book>/<n>.json` (1 189 fichiers) | ~4 Ko | quand il devient visible |
| Corpus | `data/bible/lsg.json` | 6,9 Mo | recherche, statistiques, export |

Ouvrir un chapitre coûte **deux requêtes** (index + chapitre) ;
`node scripts/bible/split-lsg.mjs --check` vérifie que la projection versionnée
est à jour (1 190 fichiers, 5 096 819 o). Licence : LSG 1910, domaine public
(`docs/SOURCES.md`).

## 5. Contrats exécutables

Chaque contrat est un test, pas une consigne.

| Garde-fou | Fichier | Ce qu'il empêche |
| --- | --- | --- |
| Aucun emoji dans l'interface | `tests/design/no-emoji.test.ts` | un emoji qui change de dessin selon la plateforme |
| Aucun service cloud | `tests/design/no-cloud-backend.test.ts` | le retour d'un backend ou d'un secret CI |
| Une seule bibliothèque d'icônes | `tests/design/solar-glass.test.ts`, `audit-plan` C12 | deux jeux de glyphes |
| Aucune couleur littérale | `audit-plan` C08 | un blanc/dominante en dur dans un écran |
| Sobriété de l'accent | `tests/design/sobriety.test.ts` | du blanc et du noir écrits en dur |
| Clés i18n existantes | `tests/unit/i18n/{parity,keys-exist}.test.ts` | un libellé qui retombe en français ailleurs |
| Parité des 45 locales | `tests/unit/i18n/parity.test.ts` | une clé primaire manquante dans une langue |
| Couverture des prototypes | `scripts/screen-coverage.mjs` | un écran de la maquette sans route |

## 6. Vérifier l'état en trois commandes

```bash
npm ci --ignore-scripts      # node_modules n'est pas versionné
npm run typecheck            # tsc -p tsconfig.app.json --noEmit
npm run verify               # tsc + eslint + tests design + audit + thèmes + parcours
```

Dernières mesures connues (2026-11-19) : `typecheck` **0 erreur** ; `vitest`
**178 fichiers / 1 695 tests, 0 échec** ; `npm run lint` **0 erreur** (1 926
avertissements préexistants, dont la dette typée des scripts) ; `npm run build`
**succès** (264 fichiers JS, 2,8 Mo ; `www/` 61 Mo avec les thèmes et la Bible).

## 7. Ce qui reste ouvert

- **Rendu visuel** : les contrôles U01–U04 exigent un navigateur.
  `scripts/visual-check.mjs` les mesure quand Playwright est installé ; sans
  lui, il sort en code 3 (« rien mesuré »), jamais en succès.
- **Traductions** : le catalogue en annonce 57, une seule est livrée ; les
  autres sont marquées indisponibles à l'écran au lieu d'être simulées.
- **Documents historiques** : `docs/AUDIT-COMPLETITE.md`,
  `docs/ARCHITECTURE_COMPLETE.md`, `docs/coordination/*` et `archive/*`
  décrivent l'état antérieur. Ils ne sont pas réécrits (décision D5).
