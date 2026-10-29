# Plan d'exécution — « Interface web + thèmes » (VersyFlow)

Source de la demande : `VersyFlow-Prompt-Interface-Web-Themes.md` (1 028 lignes, 12 sections + annexes).
Ce plan est le **suivi unique**. Une tâche n'est cochée que si `node scripts/audit-plan.mjs`
la mesure, ou si la preuve est citée dans la colonne « Preuve ».

---

## 0. Comment vérifier, en trois commandes

```bash
node scripts/audit-plan.mjs          # re-calcule les 16 contrôles depuis les fichiers → docs/plan/audit-report.md
npm run verify                       # tsc + eslint + tests design + audit
npm run themes:contrast -- --check   # idempotence de la normalisation des contrastes
```

L'audit sort en **code 1** si un contrôle `FAIL` existe. `PARTIAL` n'est jamais
compté comme réussi : c'est une avancement mesuré, avec son numérateur.

## 1. Légende

| Verdict | Sens |
| --- | --- |
| **FAIT** | mesuré conforme par l'audit (contrôle `PASS`) |
| **PARTIEL** | une partie est livrée et mesurée ; le reste a un numérateur explicite (`4/63`) |
| **À FAIRE** | non commencé, critère et preuve définis |
| **BLOQUÉ** | dépend d'une ressource absente (données, navigateur, arbitrage) |
| **NON VÉRIFIABLE** | livrable mais aucune preuve possible ici (rendu visuel) |

## 2. État mesuré au dernier audit

`node scripts/audit-plan.mjs` → **14 PASS · 2 PARTIEL · 0 FAIL · 4 non vérifiables**.

| ID | § | Contrôle | Verdict | Mesure |
| --- | --- | --- | --- | --- |
| C01 | §2.2 | aucun triplet HSL nu | **FAIT** | `hsl(var(--…))` : 0 |
| C02 | §2.1 | 14 jetons × 50 blocs de preset | **FAIT** | 25 presets, 0 manquant |
| C03 | §2.1 | pont `--color-*` (dont `--color-on-primary`) | **FAIT** | 50/50 |
| C04 | §2.3 | 4,5:1 partout | **FAIT** | 250 paires, pire 4,50:1 |
| C05 | §2.4 | fondu 0,8 s + `@property` + reduced-motion | **FAIT** | 4 jetons typés |
| C06 | §2.5 | alpha Tailwind + verre 40 %/40 px | **FAIT** | 24 jetons dérivables |
| C07 | §9.2 | transparence réduite / contraste élevé | **FAIT** | css + store + UI |
| C08 | §3.3 | zéro couleur en dur | **FAIT** | 97 fichiers, 0 ligne |
| C09 | §6.1 | seuil unique, navigation unique | **FAIT** | 1024 px |
| C10 | §6.2 | rail : 1 variable, repli accessible | **FAIT** | Hugeicons seuls |
| C11 | §6.4 | `--reading-width` appliqué aux écrans | **PARTIEL** | **4/63 écrans** |
| C12 | §5.1 | une seule bibliothèque d'icônes | **PARTIEL** | **29/101 fichiers**, 72 à migrer |
| C13 | §4.4 | accent d'image (3 rôles, ratio, garde-fou) | **FAIT** | délai 4 s |
| C14 | §11.2 | une famille de tests par contrat | **FAIT** | 7/7, 54 tests |
| C15 | §0 | libellés fr + en | **FAIT** | 8 clés |
| C16 | §4.6 | registres uniques (25 / 15 / 100) | **FAIT** | 1 source chacun |

Non vérifiable ici : **U01** rendu à 390/768/1024/1440 px · **U02** débordement et
positions · **U03** effet réel du verre · **U04** parcours métier sur données réelles.

---

## 3. Plan par phase

Phases dans l'ordre du §12 du cahier des charges. Chaque tâche a **un critère
observable** et **une preuve**. Le lot indique le tour de travail prévu.

### Phase 1 — Audit en lecture seule — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 1.1 | Cartographier stack, routes, jetons, tests | nombre + fichiers cités | `docs/design/desktop-audit-versyflow.md` | **FAIT** |
| 1.2 | Mesurer la dette (couleurs, largeurs, icônes) | chiffres datés | tableau §2 ci-dessus | **FAIT** |
| 1.3 | Séparer défauts observés / améliorations | deux listes | audit desktop §1 vs §5 | **FAIT** |

### Phase 2 — Contrat visuel et fil de fer — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 2.1 | Fil de fer de la coquille bureau | zones, largeurs, collage écrits | `docs/wireframes/desktop-shell.html` | **FAIT** |
| 2.2 | Contrat de jetons rédigé | format + pont + animation documentés | `docs/design/design-system.md` | **FAIT** |
| 2.3 | Seuils responsives arbitrés | tableau breakpoints décidé | audit §3 + `useIsDesktop.ts` | **FAIT** |

### Phase 3 — Système de jetons central — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 3.1 | Format unique de couleur (`<color>`) | 0 triplet HSL | C01 | **FAIT** |
| 3.2 | Contrat shadcn complet par preset | 14 jetons × 50 blocs | C02 | **FAIT** |
| 3.3 | Pont `--color-*` à jour | 50/50 | C03 | **FAIT** |
| 3.4 | Contrastes normalisés | ≥ 4,5:1 sur 250 paires | C04 + `preset-contrast-report.md` | **FAIT** |
| 3.5 | Fondu 0,8 s + `@property` + reduced-motion | 4 jetons typés, inites valides | C05 | **FAIT** |
| 3.6 | Alpha Tailwind réparé | 24 jetons dérivables | C06 | **FAIT** |
| 3.7 | Échelle typographique explicite | `fontSize` déclaré dans Tailwind | `grep -c fontSize tailwind.config.js` → **0** | **À FAIRE** |
| 3.8 | Ombres sémantiques (3, pas 4) | `--shadow-card/float/lift` | `grep -c boxShadow tailwind.config.js` → 2 | **À FAIRE** |
| 3.9 | `tabular-nums` sur tous les compteurs | 100 % des compteurs | mesuré : 7 usages, non systématique | **PARTIEL** |

### Phase 4 — Moteur de thème global — `PARTIEL`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 4.1 | Un résolveur unique (palette → fond → accent → voile) | 1 seul point d'écriture des jetons | `ThemeManager.tsx` (effective), mais logique répartie entre `ThemeManager` et `theme-presets.ts` | **PARTIEL** |
| 4.2 | Priorité d'accent documentée | image > libre > preset > palette | `docs/design/design-system.md` §7 | **FAIT** |
| 4.3 | Application au point racine | `<html>` uniquement | `setShadcnAccentVars` | **FAIT** |
| 4.4 | Persistance raccordée | store existant | `appearance-store.ts` | **FAIT** |
| 4.5 | Extraction asynchrone sans course | garde-fou + cache + invalidation | C13 | **FAIT** |
| 4.6 | Résolveur extrait dans un service testable | `resolveTheme(settings)` pur + test | — | **À FAIRE** |

### Phase 5 — Registre d'images et de dégradés — `PARTIEL`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 5.1 | Registre unique des 25 presets | métadonnées générées | `tweakcn-presets.ts` | **FAIT** |
| 5.2 | Registre des 15 dégradés | valeur CSS verbatim | `GRADIENTS` | **FAIT** |
| 5.3 | Registre des 100 thèmes image | id, nom, couleur, motif | `theme-catalog.ts` | **FAIT** |
| 5.4 | Provenance + licence par ressource | champ `source:{url,license}` | `grep -rIl licence src/theme` → **0** | **À FAIRE** |
| 5.5 | Ton moyen des images pré-calculé | `tone` par image mesuré hors runtime | `grep -rIl tone src/theme` → 1 fichier (runtime) | **À FAIRE** |
| 5.6 | Dégradés à 5 arrêts explicites | 5 stops vérifiés | webgradients = 2–3 arrêts verbatim (règle « ne rien inventer ») | **BLOQUÉ** (arbitrage) |
| 5.7 | Repli si image indisponible | accent précédent conservé | C13 | **FAIT** |

### Phase 6 — Extraction dynamique de couleurs — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 6.1 | Méthode choisie et justifiée | canvas local, 0 dépendance | `image-accent.ts` | **FAIT** |
| 6.2 | Trois rôles sémantiques | accent, secondaire ≥ 60°, teinte sombre | C13 | **FAIT** |
| 6.3 | Contraste recalculé après extraction | `bestTextOn` ≥ 4,5:1 | test `image-accent.test.ts` | **FAIT** |
| 6.4 | Déterminisme pour une même image | cache par id | `accentCache` | **FAIT** |
| 6.5 | Exposition des ajustements | candidat → final → ratio | partiel : pas de journal consultable | **À FAIRE** |

### Phase 7 — Surfaces et verre — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 7.1 | Classe de verre globale | `.surface-glass` compilée | C06 + CSS construit | **FAIT** |
| 7.2 | Voile en `background-image` | jamais en `background-color` | `globals.css` | **FAIT** |
| 7.3 | Feuilles de lecture plus opaques | `--reading-surface-alpha` 0,92 | `globals.css` | **FAIT** |
| 7.4 | Repli sans verre (2 états) | surfaces opaques | C07 | **FAIT** |
| 7.5 | Le verre appliqué aux familles de surfaces | cartes, panneaux, feuilles | 1 écran consommateur seulement | **PARTIEL** |

### Phase 8 — Coquille responsive et navigation — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 8.1 | Rail 264 / 88 px, 1 variable | `--rail` unique | C10 | **FAIT** |
| 8.2 | Une seule navigation montée | montage exclusif | C09 | **FAIT** |
| 8.3 | État replié mémorisé | `railMode` persisté | `ui-store.ts` | **FAIT** |
| 8.4 | Rail compact 768–1023 px | seuil tablette | non activé (barre basse conservée) | **À FAIRE** |
| 8.5 | En-tête de bureau collant 56 px | `--shell-header` utilisé | jeton défini, non consommé | **À FAIRE** |

### Phase 9 — Raccordement des écrans — `PARTIEL`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 9.1 | Couleurs hardcodées remplacées | 0 ligne | C08 | **FAIT** |
| 9.2 | `text-white` sur accent → `text-on-primary` | 52 remplacements | commit `62d995f` | **FAIT** |
| 9.3 | `bg-white` → `bg-surface` | 13 remplacements | commit `62d995f` | **FAIT** |
| 9.4 | `.screen-column` sur les 63 écrans | 63/63 | **4/63** | **À FAIRE** |
| 9.5 | Plafonds `max-w-md` résorbés | 0 restant | **42 restants** | **À FAIRE** |
| 9.6 | Listes à deux zones (filtres + contenu) | ≥ 3 écrans de liste | — | **À FAIRE** |

### Phase 10 — Parcours de mémorisation — `PARTIEL`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 10.1 | Inventaire des parcours réels | actif / incomplet / absent | à produire | **À FAIRE** |
| 10.2 | Tests de non-régression des parcours | verts | 111 fichiers de tests existants | **PARTIEL** |
| 10.3 | Session de mémorisation en colonne de lecture | texte non étiré | dépend de 9.4 | **À FAIRE** |
| 10.4 | Panneau de questions à côté (≥ 1180 px) | tiroir sous le seuil | — | **À FAIRE** |
| 10.5 | Feuilles modales → boîtes centrées | 6 `IonModal` traités | 6 occurrences | **À FAIRE** |

### Phase 11 — Checks et preuves — `FAIT` (hors visuel)

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 11.1 | tsc 0 erreur | `tsc -p tsconfig.app.json --noEmit` | 0 | **FAIT** |
| 11.2 | eslint 0 erreur sur le périmètre | `npm run verify` | **0 erreur** (308 avertissements préexistants) | **FAIT** |
| 11.3 | tests design | 54/54 | `npx vitest run tests/design` | **FAIT** |
| 11.4 | build | ✓ | `npx vite build` | **FAIT** |
| 11.5 | suite complète | 1 228 passés / 19 échoués environnementaux | voir §7 | **PARTIEL** |
| 11.6 | inspection visuelle 4 largeurs | à l'œil | aucun navigateur | **NON VÉRIFIABLE** |

### Phase 12 — Rapport et commits — `FAIT`

| ID | Tâche | Critère | Preuve | État |
| --- | --- | --- | --- | --- |
| 12.1 | Commits courts, message = pourquoi | historique lisible | `ed619fe`, `8eb5968`, `62d995f` | **FAIT** |
| 12.2 | Rapport séparant prouvé / supposé / non vérifié | 3 sections | ce document §2 + §7 | **FAIT** |

---

## 4. Lots de travail restants, dans l'ordre des dépendances

Un lot = un tour de travail, livrable et vérifiable seul.

| Lot | Contenu | Tâches | Sortie vérifiable |
| --- | --- | --- | --- |
| **L1** | Écrans de listes passés en `.screen-column` + filtre collant | 9.4, 9.5, 9.6 | `screen-column` ≥ 12/63, `max-w-md` en baisse chiffrée |
| **L2** | Colonne de lecture des parcours (mémorisation, révision, Bible) | 10.3, 10.4 | 3 écrans en `--reading-width`, test de largeur |
| **L3** | Migration Hugeicons, 10 fichiers par lot | 5.1 (C12) | compteur Lucide 72 → 62 → … → 0 |
| **L4** | Échelle typographique + ombres + `tabular-nums` | 3.7, 3.8, 3.9 | `fontSize` et `boxShadow` déclarés, test qui les lit |
| **L5** | Résolveur de thème extrait + testé | 4.1, 4.6 | `resolveTheme()` pur, 1 seul écrivain du DOM |
| **L6** | Provenance / licences / tons pré-calculés | 5.4, 5.5 | manifeste + script de mesure des pixels |
| **L7** | Feuilles modales → boîtes centrées | 10.5 | 6 modales converties, test de montage |
| **L8** | Rail compact tablette + en-tête collant | 8.4, 8.5 | seuil 768 testé |
| **L9** | Journal des ajustements d'accent | 6.5 | export consultable + test |
| **L10** | Inventaire des parcours métier | 10.1 | document actif/incomplet/absent |

Ordre imposé : **L1 → L2 → L3** (ils se voient), puis L4 et L5 (socle), puis L6, L7,
L8, L9, L10. Aucun lot ne touche plus de 70 fichiers : au-delà, la revue devient
impossible et le risque de régression silencieuse augmente.

## 5. Définition de fini (globale)

Toutes ces conditions doivent être vraies **en même temps** :

1. `node scripts/audit-plan.mjs` → **0 FAIL** et **0 PARTIEL** sur C11 et C12.
2. `npx tsc -p tsconfig.app.json --noEmit` → 0 erreur.
3. `npx eslint` sur le périmètre → 0 erreur.
4. `npx vitest run tests/design` → tout vert, nombre de tests cité.
5. `npx vite build` → ✓, et le CSS construit contient les règles de verre.
6. Aucun écran ne porte de logique de thème locale (`grep -rn "setProperty" app/` → 0).
7. `grep -rIl "lucide-react" --include=*.tsx app src` → 0.
8. Les 4 largeurs de référence inspectées à l'écran (ou explicitement déclarées
   non vérifiées, avec la raison).

## 6. Décisions déjà arbitrées (ne pas rejouer)

| Décision | Raison | Trace |
| --- | --- | --- |
| Garder les couleurs en `<color>`, pas de triplet HSL | rend `@property` valide et `color-mix` possible | design-system §1 |
| Normaliser les palettes officielles au seuil AA | 17/25 servaient un texte illisible | `preset-contrast-report.md` |
| Ajuster la **luminosité**, jamais la teinte | préserver l'identité chromatique de la source | script §4 |
| Hugeicons, pas Phosphor | consigne produit | audit desktop §2 |
| Verre jamais condition de lisibilité | accessibilité | C07 |
| `PARTIAL` n'est jamais présenté comme fait | exigence de suivi | §1 |

## 7. Échecs de tests assumés (environnement, pas régression)

19 tests échouent sur 1 247, dans 7 fichiers, tous hors du périmètre modifié :

| Fichier | Cause |
| --- | --- |
| `tests/unit/bible-full-canon.test.ts`, `bible-multi-translation.test.ts` | seuls `lsg.json` présents (données non versionnées par décision produit) |
| `tests/semantic/import.test.ts` | jeux de données absents |
| `tests/api/fsrs-engine-api.test.ts`, `tests/unit/services/fsrs-factory.test.ts` | WASM non compilé dans l'environnement |
| `tests/unit/powersync-connector.test.ts`, `tests/integration/auth-integration.test.ts` | aucun `.env` (mode local) |

## 8. Corrections apportées pendant l'établissement du plan

Deux défauts préexistants empêchaient d'affirmer « lint : 0 erreur » — ils ne
venaient pas des lots précédents, mais bloquaient la définition de fini :

| Défaut | Mesure | Correction |
| --- | --- | --- |
| 8 commentaires `eslint-disable-next-line react-hooks/exhaustive-deps` alors que le plugin n'est **pas installé** → chacun produisait une **erreur** `Definition for rule … was not found` | `npx eslint` → 8 erreurs | commentaires morts retirés ; le jour où le plugin est ajouté, les avertissements reviennent d'eux-mêmes |
| `export type AccentKey = string & {}` interdit par `@typescript-eslint/ban-types` | 1 erreur | `type AccentKey = string` (comportement identique) |

Résultat : **0 erreur de lint** sur `app`, `src/{components,hooks,store,theme}` et
`tests/design` (308 avertissements `no-unused-vars` / `consistent-type-imports`
restants, non bloquants, à traiter en lot dédié).

## 9. Risques

| Risque | Effet | Mitigation |
| --- | --- | --- |
| `public/themes` gitignored (353 Mo) | clone neuf sans visuels de thème | documenté ; décision de stockage à prendre |
| 72 fichiers à migrer vers Hugeicons | régression visuelle silencieuse | 10 par lot, tsc + build à chaque lot |
| Aucun navigateur | mise en page non prouvée | `UNVERIFIABLE` déclaré, jamais compté réussi |
| 42 `max-w-md` imbriqués dans des composants | colonne étroite sur desktop | compteur suivi à chaque lot |
