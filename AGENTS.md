# AGENTS.md

<!-- BACKEND:START -->
## Backend — aucun

Ce dépôt est **100 % frontend** : l'application ne fait aucun appel à un backend.
Les données (profils, famille, mémorisation, sémantique, marketplace) vivent en
local derrière les interfaces de `src/infrastructure/repository/ports.ts`, et le
mode de données se choisit via `VITE_DATA_MODE` (`mock` par défaut).

- Mode et repositories : `src/dev/mode.ts`, `src/infrastructure/repository/mode-repositories.ts`.
- Bible : JSON local dans `public/data/bible/` (chargé paresseusement via `src/services/bible-text-service.ts`).
- Aucun secret n'est requis pour lancer, tester ou builder l'application.
<!-- BACKEND:END -->

<!-- PLAYBOOK:START -->
## Règles d'écran (UX/UI Playbook 2026)

Chaque écran de `app/` est jugé par `node scripts/audit-playbook.mjs` : les
règles ci-dessous sont recalculées sur le dépôt, jamais déclarées. Un écran
n'est pas « beau » ou « laid » : il est lisible, prévisible, cohérent, rapide.

**Structure.** Un seul `h1` par écran (A01) — le titre de `FullScreenPage` ou
`OnboardingShell` ; tout autre titre est un `h2`. Une région `<main>` nommée par
coquille et un `<nav>` nommé par navigation (A02). Au plus cinq entrées dans la
barre principale (A04). Un seul objectif et une seule action primaire (A06).

**États.** Cinq états avant de dire un écran fini (E01) : vide, chargement,
erreur, succès, limite. Vide = message court + **une** action (`EmptyState`).
Chargement = squelette **à la forme du contenu** (`ScreenSkeletons`, une forme
par écran), jamais un spinner plein écran ; aux 91 routes paresseuses, le repli
suit la famille d'écran (`RouteSkeletons`). Erreur = ce qui s'est passé, ce qui
n'a pas été perdu, un bouton de reprise. Un `disabled` explique comment
l'activer (E05).

**Typographie.** Rien d'utile sous 12 px à l'échelle par défaut (C01) : le
micro-libellé est un choix documenté, pas un défaut. 45 à 80 caractères par
ligne de lecture (C04). Aucune taille littérale `text-[Npx]` dans un écran.

**Couleur.** Aucune couleur en dur (L01) : tout passe par les jetons du preset
(`--color-*`, `--gc`, `--tx`). Contraste 4,5:1 pour le corps, 3:1 pour le grand
texte, les icônes et l'anneau de focus (B01–B03). Jamais d'information portée
par la couleur seule (B04) : un état a aussi un texte ou une icône.

**Cibles.** 24 × 24 px au minimum partout (D01), 44 px sous `pointer: coarse`
(iOS, D02) et 48 px sur Android (D03) — `.touch-target` et `--tap-min` portent
ces planchers. Aucune action destructrice collée à une action fréquente (D06).

**Formulaire.** Un libellé visible relié au champ (F01), l'erreur sous le champ
avec `aria-invalid` et une annonce (F02, F03), clavier adapté (`type`,
`inputMode`).

**Clavier.** Lien d'évitement en premier (`SkipLink`), focus visible partout
(`:focus-visible`), focus déplacé après navigation (`useRouteFocus`) sans le
voler (H01, H04), fermeture par Échap pour les surfaces superposées.

**Mouvement.** `prefers-reduced-motion` respecté globalement (I03) ; aucune
boucle d'animation infinie, aucune animation au-delà de 400 ms sans raison
(I04). Le balayage du squelette est la seule boucle admise : elle porte
l'attente, et elle est coupée en mouvement réduit.

**Zoom.** `user-scalable=no` est interdit (C02, H05) : le texte doit tenir à
200 % sans perte ni défilement horizontal.

**Honnêteté.** Aucun chiffre sans source ni date (K02) ; trois statuts
seulement : vérifié / estimé / non fait. Aucune case pré-cochée pour un
consentement (K01). Aucune promesse que l'application ne tient pas (G04).
<!-- PLAYBOOK:END -->
