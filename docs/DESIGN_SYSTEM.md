# Design system — par où commencer

Ce fichier est un **index**, pas un contrat de plus : deux documents font autorité,
et chacun a un périmètre distinct. Les lire dans cet ordre évite de chercher une
règle dans le mauvais fichier.

| Document | Ce qu'il contient | Quand le lire |
| --- | --- | --- |
| [`design/DESIGN-SYSTEM.md`](design/DESIGN-SYSTEM.md) | Le contrat **d'usage** : 8 tailles de texte, grille d'espacement de 4, rayons, ombres, couleur, icônes, cinq états, mouvement, planchers d'accessibilité, paliers responsive. Vérifié par `node scripts/audit-playbook.mjs`. | Avant d'écrire un écran |
| [`design/design-system.md`](design/design-system.md) | Le contrat **de jetons** : format des couleurs (pas de triplet HSL), pont `--color-*`, animation `@property` 0,8 s, alpha Tailwind, recette de verre, contrastes mesurés. Vérifié par les tests de `tests/design/`. | Avant de toucher `src/styles/` ou un jeton |
| [`06-design-system.md`](06-design-system.md) | La **direction artistique** d'origine (mood board, intention). Document de référence produit, non exécutable. | Pour comprendre l'intention |
| [`07-design-tokens.md`](07-design-tokens.md) | La **liste** des jetons (nom, rôle, valeur par défaut). | Pour retrouver un nom |
| [`design/PLAYBOOK-AUDIT.md`](design/PLAYBOOK-AUDIT.md) | Le **rapport** des 77 règles UX/UI, généré. Ne pas éditer à la main. | Pour savoir ce qui est vérifié, partiel ou non vérifiable ici |

## Les cinq règles qui décident d'un écran

1. **Un jeton, jamais une couleur** — `text-on-primary`, pas `text-white`.
2. **Une mesure de lecture** — `.screen-column-narrow` (720 px) pour lire,
   `.screen-column` (1060 px) pour parcourir.
3. **Une navigation montée** — < 768 px la barre basse, ≥ 768 px le rail.
4. **Cinq états** — vide (avec action), chargement (squelette de la forme de
   l'écran), erreur (qui dit quoi faire), succès, limite.
5. **Aucune donnée inventée** — si la donnée manque, l'écran montre son état
   vide réel.

Les détails, les valeurs exactes et les garde-fous associés sont dans
`design/DESIGN-SYSTEM.md` ; l'état mesuré du dépôt (routes, données, contrats)
est dans [`AUDIT.md`](AUDIT.md).
