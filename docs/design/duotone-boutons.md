# Boutons duotone — diagnostic et cinq règles possibles

> État : **brouillon de décision**. Rien n'est appliqué à l'application.
> Le laboratoire `/__dev/duotone` (développement uniquement) montre les cinq
> options côte à côte, dans le thème clair et le thème sombre.

## 1. Ce qu'on voit, et pourquoi

Ressenti de départ : *« on voit juste des duotone en monochrome, et quand on
s'approche la couleur active prend le contrôle »*.

Ce n'est ni un problème de jeu d'icônes, ni une fatalité du duotone. Trois
faits, vérifiés dans le code :

1. **Les icônes Solar « duotone » ont deux calques.** Le second porte, en
   style en ligne, `color: var(--solar-secondary-color, currentColor)` et
   `opacity: var(--solar-secondary-opacity, .5)`
   (`node_modules/@solar-icons/react/dist/lib/IconBase.mjs`).
2. **`DuoIcon` ne passe jamais de seconde couleur.** Le composant transmet
   `secondaryOpacity` mais pas `secondaryColor` : la variable reste vide, le
   second calque retombe sur `currentColor`. Deux calques, une seule teinte →
   ce n'est pas un duotone, c'est un **monochrome à deux densités**. Le calque
   secondaire n'ajoute pas de profondeur, il salit le trait.
3. **Deux règles CSS se contredisent.** `globals.css` l. 1162 pose
   `color: var(--color-primary)` en commentant « l'accent dès le repos, jamais
   seulement au survol ». Puis l. 1314 pose `color: var(--mut)`, avec
   `--acc` au survol et à l'état actif. La seconde gagne par ordre de cascade.
   **La première est du code mort qui dit le contraire de ce qui s'affiche.**

Bonus : `DuoIcon` accepte une prop `color` puis la jette (`color: _color`).
`BottomTabs` lui passe `var(--acc-text)` / `var(--mut)` en croyant piloter
l'icône : cette intention est silencieusement perdue.

## 2. Le levier

La couleur du second calque se règle **en CSS**, depuis n'importe quel
ancêtre :

```css
.mon-bouton .solar {
  --solar-secondary-color: var(--acc);
  --solar-secondary-opacity: 0.24;
}
```

Aucune des **549 utilisations** de `DuoIcon` n'est à modifier, aucune prop à
propager, aucune icône à remplacer. Tout tient dans la règle d'affichage.
`tests/design/duotone-layers.test.tsx` verrouille ce contrat : si une montée
de version de la bibliothèque change la structure, le test tombe au lieu de
laisser les icônes redevenir monochromes en silence.

## 3. Les cinq règles

| | Règle | Repos | Survol | Actif | Risque |
| --- | --- | --- | --- | --- | --- |
| **0** | Aujourd'hui | encre `--mut`, second calque même teinte | bascule vers `--acc` | `--acc` + pastille 10 % | la bascule au survol ; gris sans identité |
| **A** | **Vrai duotone** | encre `--tx` teintée, masse `--acc` 24 % | pastille 7 %, voile 30 % — **la teinte ne bouge plus** | `--acc-text`, voile 36 %, pastille 11 % | demande un réglage par thème (contraste du voile) |
| **B** | **Pastille** | encre franche `--tx`, second calque même teinte 26 % | pastille `--acc` 7 % | `--acc-text` + pastille 13 % + filet 34 % | très sobre, parfois trop : peu de « duotone » |
| **C** | **Remplissage** | creux : `--mut`, voile 10 % | encre remontée, voile 20 % | plein : `--acc-text`, voile 48 % | l'actif crie plus fort que B |
| **D** | **Deux accents** | `--acc-text` + `--acc2` 42 % | pastille 8 % | `--acc` 55 % + pastille 14 % | sur un preset saturé, deux teintes voisines se disputent |

## 4. Recommandation

**A pour l'icône, B pour le contenant, C réservé à l'onglet mobile actif.**

- Le duotone redevient un duotone : une encre et une masse colorée, perceptible
  au repos, sans jamais basculer d'un coup au survol.
- La couleur ne « prend pas le contrôle » au survol : elle est déjà là. Le
  survol ne change que la pastille et la densité du voile (180 ms).
- L'état actif n'est jamais porté par la seule teinte : il cumule encre,
  voile, pastille, filet et — dans la barre d'onglets — le point et le libellé.
  Il reste lisible en niveaux de gris et pour un daltonien.
- Aucune valeur figée : tout dérive de `--acc`, `--acc2`, `--acc-text`,
  `--tx`, `--mut`. Les 39 presets et les quatre presets de verre suivent.

## 5. Voir, puis trancher

```bash
npm run dev:mock
# Panneau de test → « Boutons duotone », ou directement :
# http://localhost:3000/__dev/duotone
```

Le labo affiche, pour chaque règle, le repos / le survol / l'actif figés côte
à côte, puis la même règle en taille réelle dans un rail et une barre
d'onglets **réellement survolables**.

Tant que la décision n'est pas prise, `globals.css` reste inchangé.
