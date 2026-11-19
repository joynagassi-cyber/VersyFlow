# Système de design VersyFlow

> Le playbook UX/UI 2026 le dit sans détour : « un écran se jette, un système se
> réutilise » (§25). Ce document est le contrat entre les jetons du dépôt et les
> écrans. Chaque valeur ci-dessous est mesurée par
> `node scripts/audit-playbook.mjs` — si une ligne n'est plus vraie, l'audit
> échoue, la règle n'est donc pas décorative.

## 1. Typographie — 8 tailles, 2 familles

| Rôle | Taille | Interligne | Où |
| --- | --- | --- | --- |
| micro | 12 px | 16 | badge, date, colonne technique |
| small | 13 px | 18 | métadonnées, aide |
| body | 15 px | 24 | texte courant de l'interface |
| body-lg | 17 px | 26 | lecture confortable, sous-titre |
| h3 | 20 px | 28 | titre de carte |
| h2-bas | 24 px | 30 | titre de section, écran |
| h2 | 28 px | 33 | titre d'écran fort |
| h1 | 32 px | 36 | un par écran, jamais deux |

Règles tenues par le code :

- **rien d'utile sous 12 px** (C01 du playbook) : l'échelle Tailwind est la seule
  source ; les classes arbitraires `text-[10px]` ont été supprimées.
- **deux familles** : Inter (interface) + Source Serif 4 (lecture biblique). Les
  10 polices de lecture **choisies par l'utilisateur** ne sont pas des familles
  du système : c'est un réglage produit, chargé à la demande.
- **mesure de lecture** : `--reading-width: min(720px, 70ch)` → 45 à 80
  caractères par ligne (C04), quel que soit l'écran.

## 2. Espacement — grille de 4

| Intention | Valeurs | Usage |
| --- | --- | --- |
| interne | 4 · 8 · 12 | dans un composant (padding de bouton, écart icône/texte) |
| structurel | 16 · 24 · 32 | entre blocs, cartes, sections |
| macro | 48 · 64 · 96 | entre sections majeures, avant un titre |

Aucun espacement arbitraire hors grille n'est accepté (contrôle S05). La
proximité porte le sens : un titre est plus proche de son paragraphe (8 px) que
du bloc précédent (32 px).

## 3. Rayons — 4 marches + pilule

| Jeton | Valeur | Usage |
| --- | --- | --- |
| hairline | `calc(4px * var(--radius-scale))` | barre, confetti, pastille fine |
| sm | `calc(8px * var(--radius-scale))` | champ, petit bouton |
| md | `calc(12px * var(--radius-scale))` | carte, panneau |
| lg | `calc(16px * var(--radius-scale))` | grand conteneur, feuille |
| xl | `calc(24px * var(--radius-scale))` | carte pleine largeur |
| full | `999px` | bouton pilule, interrupteur, avatar |

Tout passe par `--radius-scale` : un thème qui arrondit davantage arrondit
l'interface entière sans qu'on touche un seul composant. Zéro rayon en pixels
bruts (contrôle S03).

## 4. Ombres — trois niveaux, jamais un noir figé

| Jeton | Usage |
| --- | --- |
| `--shadow-card` | une carte posée sur le papier |
| `--shadow-float` | une surface qui flotte (barre, dock) |
| `--shadow-lift` | un élément soulevé (feuille modale, menu) |

Les trois sont dérivées de **l'encre du thème** (`color-mix` sur
`--color-text-primary`) : elles suivent le mode sombre et les thèmes image au
lieu de rester noires (contrôle S04).

## 5. Couleur — système, pas palette

- un jeu de jetons **clair** et un jeu **sombre** (`[data-theme='dark']`), jamais
  un filtre sur le premier (B05) ;
- **trois couches, un seul propriétaire par couche** (30/10) :
  1. le *preset* (`:root[data-preset]` dans `vendored-themes.css`) possède les
     surfaces (`--color-surface`), le texte et la primaire ;
  2. `globals.css` **dérive** ses alias (`--gc`, `--tx`, `--mut`, `--acc`) de ces
     jetons — plus aucune valeur de neutre en dur (`#171717`, `#1b1220`) : c'était
     la raison pour laquelle changer de palette ne changeait rien à l'écran ;
  3. le **fond est absolu** : `#000000` en sombre (OLED), `#ffffff` en clair, quel
     que soit le preset, via `html:root[data-preset]` (spécificité supérieure aux
     blocs générés) ;
- l'accent **est** la primaire du preset, sans mélange ni désaturation : un
  `color-mix(primary 45 %, neutre)` transformait « Lara Red » (#ff2056) en rose
  saumon (#de7a92) — mesuré sur capture, corrigé le 30/10. Un seul cas dérogé :
  `--acc-text` en clair, assombri à 72 % pour tenir AA sur le texte d'accent ;
- avant le montage du preset (premier rendu, splash), les replis de `:root` et
  d'`index.html` portent **déjà** les valeurs du thème par défaut : plus de
  magenta transitoire au démarrage ;
- l'accent vient du thème choisi par l'utilisateur et ne sert qu'à l'action et à
  l'état actif — pas au décor ;
- sur fond image (`data-bg='image'`), le texte repasse au noir/blanc purs : le
  verre laisse passer la photo, la teinte du preset n'y tient pas AA ;
- l'information n'est jamais portée par la couleur seule : `aria-current`,
  `aria-checked`, icône ou texte (B04) ;
- contraste mesuré : texte ≥ 4,5:1, grand texte et traits d'interface ≥ 3:1
  (B01–B03), recalculé par l'audit à chaque exécution.

## 6. Icônes — une famille, trois tailles, une graisse

`ICON_SIZES` dans `src/components/ui/DuoIcon.tsx` :

| Jeton | Valeur | Usage |
| --- | --- | --- |
| `sm` | 16 px | dans une phrase, une cellule, un badge |
| `md` | 20 px | bouton, ligne de liste, formulaire, en-tête |
| `lg` | 24 px | barre d'onglets, titre de section, action principale |
| `illustration` | 32 px | glyphe d'un état vide (imagerie, pas icône d'interface) |

Graisse unique `ICON_STROKE = 2` : à 16–24 px, 1,75 px de trait disparaît sur
les écrans denses et en contraste réduit. Aucune surcharge dans les écrans
(contrôle S02) ; toute icône sans `aria-label` est `aria-hidden`.

## 7. États — cinq, nommés

| État | Composant | Ce qu'il fait |
| --- | --- | --- |
| vide | `EmptyState` | propose toujours une action |
| chargement | `ScreenSkeleton`, `SkeletonLines` | réserve la place exacte du contenu, n'apparaît qu'au-delà de 220 ms |
| erreur | `ErrorBoundary`, messages de champ | dit quoi faire, sous le champ, `role="alert"` |
| succès | écran de confirmation | propose l'étape suivante (jamais un spinner) |
| limite | listes vides filtrées | explique le filtre et comment l'enlever |

## 8. Micro-copie

- **verbe + objet** : « Enregistrer mon rappel », jamais « OK », « Valider »,
  « Suivant » (contrôle S06). Dans le parcours d'entrée, chaque bouton nomme son
  effet : « Choisir ma langue », « Démarrer avec ces réglages ».
- l'erreur dit ce qui s'est passé **et** quoi faire, sous le champ concerné,
  reliée par `aria-describedby` et annoncée par `role="alert"`.
- une seule langue active à la fois, accents compris.

## 9. Mouvement

- aucun `animation: … infinite` : le pouls de mémorisation fait trois tours, le
  balayage des squelettes deux passages ;
- **pas de clignotement de chargement** : un squelette ne s'affiche qu'après
  220 ms (`useDelayedFlag`) et entre en fondu de 240 ms. En dessous de ce seuil,
  le contenu est déjà là : ne rien montrer est plus honnête qu'un flash gris ;
- au-delà de 400 ms, la durée doit être écrite en commentaire avec sa raison
  (retournement de carte 450 ms, confettis de réussite 800 ms) ;
- `prefers-reduced-motion: reduce` coupe animations, transitions et
  `animate-spin`/`animate-pulse` ; le squelette apparaît alors sans fondu (le
  délai, lui, reste : ce n'est pas du mouvement mais de la visibilité) ;
- teintes du squelette : `--skeleton-base` / `--skeleton-sheen`, dérivées des
  jetons de surface et de texte par thème. Jamais un aplat de `text-primary` :
  en clair il rend un gris sans relief, en sombre un bloc plus clair que la
  carte qu'il occupe.

## 10. Accessibilité — planchers

- commandes : 24 × 24 px minimum, 44 px sous `pointer: coarse`, 48 px sur
  Android ;
- lien d'évitement en tête de coquille, `#main-content` focusable, focus déplacé
  après navigation sans être volé ;
- `:focus-visible` visible sur toute commande ;
- `lang` et `dir` suivis à l'exécution, mise en page en propriétés logiques
  (`ps/pe/ms/me/start/end`) pour que le RTL bascule.

## 11. Responsive

| Palier | Largeur | Colonne de contenu |
| --- | --- | --- |
| mobile | 360–639 px | pleine largeur, marges 16 px |
| tablette | 640–1023 px | 24 px de marge, rail replié |
| bureau | 1024–1439 px | colonne de lecture, rail dépliable |
| large | ≥ 1440 px | contenu centré, jamais étiré |

Aucune largeur fixe supérieure à 320 px sans variante conditionnelle
(`sm:`/`md:`), sinon la cible 320 px casse.

## 11 bis. Parcours d'entrée — deux mises en page, un seul parcours

`src/components/onboarding/steps.ts` est la seule liste des étapes : la coquille
en déduit le numéro, le total, « Retour » et l'étape suivante. Ajouter une étape
se fait là, une fois.

| | Web (≥ 1100 px) | Mobile (< 1100 px) |
| --- | --- | --- |
| structure | deux colonnes, 1180 px max | une colonne, plein écran |
| navigation | sommaire vertical nommé, étapes passées cliquables | barre segmentée + « Étape n sur 7 » |
| action | bouton à droite de la colonne de contenu | bouton pleine largeur collé en bas |
| appui | verset en pied de panneau | verset dans le flux de l'étape |

Sept étapes : **Bienvenue · Langue · Apparence · Traduction · Rythme · Rappels ·
Prêt**. L'étape « Apparence » écrit directement dans `appearance-store` —
`setPreset` pour la palette (c'est `data-preset` que lit le CSS), `setThemeMode`
pour clair/sombre/système, `setBibleFontSize` pour le confort de lecture.
L'aperçu de l'étape est donc le vrai rendu, et le récapitulatif final affiche la
couleur retenue : ce que l'on choisit au début se retrouve à la fin.

## 12. Comment on vérifie

```bash
node scripts/audit-playbook.mjs          # 77 règles + 6 contrôles système
npx vitest run tests/design              # dont playbook-rules.test.tsx
npm run verify                            # types, lint, tests, audits
```

Le rapport `docs/design/PLAYBOOK-AUDIT.md` sépare toujours **vérifié**,
**partiel**, **en échec** et **non vérifiable ici** — et pour ces derniers, dit
comment les vérifier (appareil, navigateur, geste).
