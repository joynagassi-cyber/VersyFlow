# Audit bureau — VersyFlow

Date : 2026-10-29. Lecture seule, chiffres produits par commandes (voir § 7).
Méthode appliquée : le méta-prompt fourni décrit **Einnote** (React 19, Phosphor,
pnpm, Vite 8, `docs/DESKTOP.md`). Ce dépôt est **VersyFlow** et diffère ; conformément
à l'annexe B du prompt (« le dépôt gagne »), les valeurs ci-dessous sont celles du
dépôt, pas celles de l'exemple.

## 1. Constats chiffrés

| # | Constat | Mesure | Commande |
| --- | --- | --- | --- |
| 1 | Aucune coquille de bureau : pas de `rail`, pas de `sidebar`, pas de `--rail` | 0 occurrence de `rail`/`--rail` dans `src` | `grep -rn "rail" src app` |
| 2 | L'interface est une colonne téléphone tendue sur grand écran | `max-w-md` **42** fois (448 px), `max-w-lg/xl/2xl` **0** | `grep -rIo "max-w-md" app src \| wc -l` |
| 3 | Aucun point de rupture exploité | `md:` **0**, `lg:` **1**, `xl:` **0** | `grep -rIo "lg:" app src \| wc -l` |
| 4 | Navigation unique mais mobile | barre d'onglets basse `mx-auto max-w-md` → pastille flottante centrée sur 1440 px | `src/components/navigation/BottomTabs.tsx` |
| 5 | Icônes : deux bibliothèques | **72** fichiers `lucide-react`, **5** fichiers `@hugeicons/*` | `grep -rIl "from 'lucide-react'" app src \| wc -l` |
| 6 | Couleurs en dur : faible dette | **4** fichiers, **7** occurrences de `#RRGGBB` en `.tsx` | `grep -rIo "#[0-9a-fA-F]\{6\}" app src` |
| 7 | Jetons existants | **30** variables `--color-*` (clair + sombre), pont Tailwind `bg-surface`, `text-text-muted`… | `grep -o "\-\-color-[a-z0-9-]*" src/styles/globals.css` |
| 8 | Feuilles modales | **6** `IonModal`, **8** occurrences « Sheet » | `grep -rIo "IonModal" app src \| wc -l` |
| 9 | En-têtes collants | **6** occurrences de `sticky` | `grep -rIo "sticky" app src \| wc -l` |
| 10 | Écrans à adapter | **63** fichiers `.tsx` sous `app/` | `find app -name "*.tsx" \| wc -l` |
| 11 | Tests existants | **111** fichiers de test, `vitest` présent | `find . -name "*.test.ts*" \| wc -l` |
| 12 | TypeScript | `tsc -p tsconfig.app.json --noEmit` → **0 erreur** | `npx tsc …` |

## 2. Ce que le méta-prompt demandait et qui NE s'applique pas

| Demande Einnote | Réalité VersyFlow | Décision |
| --- | --- | --- |
| `@phosphor-icons/react` partout | Hugeicons imposé par le commanditaire (`@hugeicons/react@1.1.10`) | **Hugeicons reste** ; Lucide est la dette à résorber (§ 5) |
| pnpm | `npm ci`/`--ignore-scripts` (build natif) | inchangé |
| Quill, `@xyflow/react`, `ts-fsrs` éditeur | éditeur de notes absent, versets + mémo | sans objet |
| 23 palettes + 34 fonds + signatures | 25 presets tweakcn + 15 gradients + 100 thèmes image | le système existant **gagne** |
| `docs/DESKTOP.md` déjà arbitré | n'existe pas | ce document + `docs/wireframes/desktop-shell.html` |

## 3. Décisions de mise en page (arbitrées ici)

| Seuil | Navigation | Contenu |
| --- | --- | --- |
| < 1024 px | barre d'onglets basse + tiroir hamburger (existant) | colonnes actuelles (`max-w-md`) |
| ≥ 1024 px | **rail** 264 px, repliable à 88 px | colonne centrée, plafond porté par page |
| ≥ 1280 px | idem | listes jusqu'à 1060 px, lecture 720 px |

- Une **seule** variable pilote la largeur : `--rail` (0 / 88 / 264 px).
  `.app-main { margin-left: var(--rail) }` — rien d'autre ne connaît la largeur.
- **Montage React, style CSS** : `useIsDesktop()` monte le rail et démonte la barre
  basse (pas de panneau caché en CSS → pas de doublon de focus ni de lecture d'écran).
- Le rail **réutilise les listes existantes** (`ALL_TABS`, `ALL_MENU_ITEMS` filtrés
  par `visibleMenuPaths`) : aucune navigation inventée, aucune entrée en double.
- État mémorisé : `railMode: 'expanded' | 'collapsed'` persisté dans `ui-store`.

## 4. Interdits que je m'applique

- Pas de couleur en dur nouvelle dans un `.tsx` ; tout passe par `--color-*`.
- Pas de seconde navigation montée en même temps.
- Pas de `!important`.
- Pas d'icône SVG écrite à la main, pas d'emoji.
- Pas de largeur en pixels éparpillés : seuils en `matchMedia`, largeurs en variables.

## 5. Dette résiduelle (annoncée, pas masquée)

- **72 fichiers** importent encore Lucide ; la migration Hugeicons est engagée
  (navigation, coquille, Apparence) mais pas terminée. Le rail, lui, est 100 %
  Hugeicons.
- Les **63 écrans** gardent leur plafond `max-w-md` : la coquille donne la place,
  chaque écran doit encore l'exploiter. Traité écran par écran, pas en une passe.
- Tablette (768–1023) : le rail compact 88 px est prévu mais monté seulement ≥ 1024 ;
  entre 768 et 1023 la barre basse reste. À trancher après vérification visuelle.

## 6. Ce qui n'est PAS vérifiable ici

Aucun navigateur dans l'environnement : la position réelle à l'écran, le rendu du verre
et le comportement au redimensionnement se vérifient **à l'œil**, aux trois largeurs
(1440 / 1024 / 390). Ce dépôt ne peut prouver que : compilation, build, règles CSS
présentes, montage conditionnel. Tout le reste est déclaré « non vérifié ».

## 7. Commandes de preuve

```
npx tsc -p tsconfig.app.json --noEmit     # 0 erreur
npx vitest run tests/design               # tests de coquille
npx vite build                            # ✓
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```
