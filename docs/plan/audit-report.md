# Rapport d’audit — plan « Interface web + thèmes »

Généré par `node scripts/audit-plan.mjs`. **Ne pas éditer à la main.**
Exécuté le 2026-10-30 06:15 (UTC).

**Bilan : 17 PASS · 0 PARTIEL · 0 FAIL · 4 non vérifiable(s).**

| ID | § | Verdict | Contrôle | Mesure |
| --- | --- | --- | --- | --- |
| C01 | §2.2 | **PASS** | Aucun jeton en triplet HSL nu (incompatible avec @property <color>) | hsl(var(--…)) : 0 · triplets nus : 0 |
| C02 | §2.1 | **PASS** | Chaque preset définit les 14 jetons du contrat (clair + sombre) | 50 blocs, 25 presets, 0 jeton(s) manquant(s) |
| C03 | §2.1 | **PASS** | Le pont --color-* suit les jetons dynamiques (dont --color-on-primary) | 50/50 blocs conformes |
| C04 | §2.3 | **PASS** | Toutes les paires texte/fond atteignent 4,5:1 (AA) | 250 paires · pire 4.50:1 (kodama-grove/dark muted-foreground/card = 4.50:1) · 0 échec(s) |
| C05 | §2.4 | **PASS** | Fondu 0,8 s sur jetons typés, valeurs initiales crédibles, mouvement réduit respecté | 4 @property <color> · initiales invalides: 0 · transition 800ms: true · courbe: true · reduced-motion: true |
| C06 | §2.5 | **PASS** | Alpha dérivable sur les variables ; recette de verre 40 % + 40 px + voile | helper: true · 24 jetons dérivables · .surface-glass: true · consommée 1× · voile en background-image: true |
| C07 | §9.2 | **PASS** | Modes « transparence réduite » et « contraste élevé » pilotables et appliqués | css: true · store: true · interrupteurs: true · attributs posés: true |
| C08 | §3.3 | **PASS** | Aucune couleur littérale dans le code d’interface (hors exception documentée) | 126 fichiers d’interface scannés · 0 ligne(s) fautive(s) |
| C09 | §6.1 | **PASS** | Deux seuils, un rôle chacun (768 px rail, 1024 px colonne), une seule navigation montée | seuils: true · montage exclusif: true · zéro px en dur: true · shells: lus |
| C10 | §6.2 | **PASS** | Rail : une variable de largeur, repli accessible, état actif non colorimétrique | variable unique: true · largeur: true · repli sr-only: true · aria: true · Hugeicons seuls: true |
| C11 | §6.4 | **PASS** | Mesure de lecture définie et appliquée à tous les écrans de contenu | 86/86 écrans couverts (classe directe ou coquille) · coquilles: ok · jetons présents |
| C12 | §5.1 | **PASS** | Une seule bibliothèque d’icônes (Hugeicons) | 135/135 fichiers sans Lucide · 0 à migrer |
| C13 | §4.4 | **PASS** | Accent d’image : trois rôles, texte choisi par contraste, pas de promesse pendante | 3 rôles: true · garde-fou de chargement: true · texte au ratio: true |
| C14 | §11.2 | **PASS** | Chaque famille de contrat a un test dédié | 11 fichiers · 7/7 familles couvertes |
| C15 | §0 | **PASS** | Les libellés ajoutés existent en français et en anglais | fr manquants: aucun · en manquants: aucun |
| C16 | §4.6 | **PASS** | Registres de thèmes : presets, dégradés et thèmes image déclarés une seule fois | 25 presets · 15 dégradés · 101 thèmes image |
| C17 | §11.1 | **PASS** | Dette de lint du shim React Native : exception documentée ET mesurée, jamais masquée | exception: documentée · dette gelée mesurée: 123 avertissements |

## Non vérifiable ici

| ID | § | Élément | Raison | Comment le vérifier |
| --- | --- | --- | --- | --- |
| U01 | §11.3 | Rendu visuel réel aux largeurs 390 / 768 / 1024 / 1440 px | Aucun navigateur ni outil de capture dans l’environnement de développement. | docs/plan/verification-manuelle.md §1 — ou `node scripts/visual-check.mjs` (Playwright) |
| U02 | §11.3 | Absence de débordement horizontal et positions réelles | jsdom ne calcule pas de mise en page ; seule l’inspection à l’écran peut le prouver. | docs/plan/verification-manuelle.md §2 — le script mesure scrollWidth − clientWidth |
| U03 | §4.5 | Rendu effectif du verre (backdrop-filter) sur les cartes | Le CSS est prouvé, l’effet composité ne l’est pas sans moteur de rendu. | docs/plan/verification-manuelle.md §3 — thème image + cartes .surface-glass |
| U04 | §7 | Parcours métier complets (mémorisation, révisions) sur données réelles | Les jeux bibliques multi-traductions sont absents du poste (données non versionnées). | docs/plan/verification-manuelle.md §4 — restaurer data/bible depuis l’historique puis jouer les 6 étapes |

## Commandes de preuve

- C01 : `grep -rn "hsl(var(" src app tailwind.config.js`
- C02 : `node scripts/audit-plan.mjs`
- C03 : `grep -c "color-on-primary: var(--primary-foreground)" src/styles/tweakcn-presets.css`
- C04 : `node scripts/apply-preset-contrast.mjs --check`
- C05 : `grep -n "@property\|--primary 0.8s" src/styles/globals.css`
- C06 : `grep -o "surface-glass{[^}]*}" www/assets/*.css (après build)`
- C07 : `grep -n "data-transparency" src/styles/globals.css src/theme/resolve-theme.ts src/components/ThemeManager.tsx`
- C08 : `npx vitest run tests/design/no-hardcoded-colors.test.ts`
- C09 : `npx vitest run tests/design/desktop-shell.test.ts`
- C10 : `npx vitest run tests/design/desktop-shell.test.ts`
- C11 : `node scripts/audit-plan.mjs`
- C12 : `grep -rIl "lucide-react" --include=*.tsx app src | wc -l`
- C13 : `npx vitest run tests/design/image-accent.test.ts`
- C14 : `npx vitest run tests/design`
- C15 : `npx vitest run tests/unit/i18n/parity.test.ts`
- C16 : `grep -c "motif:" src/theme/theme-catalog.ts`
- C17 : `npx eslint src/components/ui/Primitives.tsx --rule '{"@typescript-eslint/no-explicit-any":"warn"}'`
