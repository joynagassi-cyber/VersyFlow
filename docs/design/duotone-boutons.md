# Boutons duotone — diagnostic et cinq règles possibles

> État : **appliqué**. Décision retenue : **A pour l'icône, B pour le
> contenant, C pour l'onglet mobile actif**.
> Le laboratoire `/__dev/duotone` (développement uniquement) montre la règle en
> vigueur, puis les cinq options côte à côte pour comparaison.

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

## 5. Ce qui a été appliqué

### A — l'icône

```css
.solar.solar-accent {
  --solar-secondary-color: var(--acc);      /* le duotone existe enfin */
  --solar-secondary-opacity: 0.24;          /* masse visible, pas criarde */
  color: color-mix(in srgb, var(--tx) 82%, var(--mut));
}
```

Le second calque porte l'accent **dès le repos**. Le survol ne change donc plus
la teinte : c'est ce qui supprime la bascule.

### B — le contenant

| État | Fond | Encre | Filet | Masse |
| --- | --- | --- | --- | --- |
| repos | transparent | `--tx` 82 % | — | 24 % |
| survol / focus | `--acc` 7 % | inchangée | — | 30 % |
| actif | `--acc` 13 % | `--acc-text` | `--acc` 34 % | 36 % |

Trois signaux à l'actif, dont deux indépendants de la teinte.

### C — l'onglet mobile actif

Creux au repos (10 %), plein à l'actif (48 %). La pastille passe de transparent
à `--acc` 12 % ; le point et le libellé suivent. Sur quatre icônes de 23 px, la
densité du duotone se lit même quand la teinte ne se distingue pas.

### Conséquences dans le code

- `DesktopRail` et `BottomTabs` ne peignent plus leurs couleurs en utilitaires
  Tailwind : ils portent `nav-item` / `tab-item` / `tab-pill`, et la couleur
  vient d'un seul bloc de `globals.css`.
- La règle morte (l. 1162, « l'accent dès le repos ») a été supprimée : elle
  affirmait le contraire de ce qui s'affichait.
- `BottomTabs` ne passe plus la prop `color` à `DuoIcon` — le composant
  l'acceptait puis la jetait. Une intention qui ne fait rien est un mensonge
  de plus dans le fichier.
- Sur une surface pleine d'accent (`.bg-primary`), le second calque repasse au
  trait : accent sur accent rendrait l'icône invisible.

### Mesures

| | Encre au repos | Contraste sur le fond | Avant |
| --- | --- | --- | --- |
| thème clair | `#271c2a` | **16,3:1** | 8,2:1 |
| thème sombre | `#eaeaea` | **14,9:1** | 10,2:1 |

Aucune valeur figée : tout dérive de `--acc`, `--acc2`, `--acc-text`, `--tx`,
`--mut`. Les 39 presets et les quatre presets de verre suivent.

## 6. Voir

```bash
npm run dev:mock
# Panneau de test → « Boutons duotone », ou directement :
# http://localhost:3000/__dev/duotone
```

Le labo ouvre sur **« ce qui est en vigueur »** : un rail et une barre
d'onglets qui n'utilisent pas ses propres règles, mais les classes réelles
`nav-item` / `tab-item` / `tab-pill`. Si le laboratoire et l'application
divergent, c'est là qu'on le voit. Viennent ensuite l'ancien état (variante 0,
conservée comme historique) et les quatre autres options.

`tests/design/duotone-buttons.test.ts` verrouille la décision : repos coloré,
survol sans changement de teinte, activation à trois signaux, et absence de la
règle morte. `tests/design/duotone-icons.test.ts` verrouille le contrat DOM des
deux calques — si une montée de version de la bibliothèque change la structure,
le test tombe au lieu de laisser les icônes redevenir monochromes.
