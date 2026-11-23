# Captures d'écran — pourquoi ce dossier est vide

`docs/screenshots/` existe pour être la destination des captures de preuve
visuelle (contrôles U01–U04 de `docs/plan/PLAN-INTERFACE-WEB.md`). Il est
**volontairement vide** : aucune capture n'a été fabriquée ici, et une capture
qui ne prouve rien serait pire qu'une absence.

## Ce qu'on ne peut pas faire dans cet environnement

L'environnement de développement de ce dépôt n'a **ni navigateur ni moteur de
mise en page** : jsdom ne calcule pas les largeurs, et Chromium/Playwright n'y
sont pas installés (`node_modules` ne contient ni `playwright` ni `puppeteer`).
Les contrôles qui exigent un rendu réel restent donc marqués
« non vérifiable ici » dans `docs/plan/audit-report.md` et
`docs/design/PLAYBOOK-AUDIT.md` — jamais « réussi ».

## Comment les produire (sur une machine avec navigateur)

```bash
# une seule fois
npm i -D playwright
npx playwright install chromium

# build servi, puis captures + mesure du débordement
npm run build
npm start &                       # http://localhost:3000
node scripts/visual-check.mjs --base http://localhost:3000 --out docs/screenshots
```

Le script :

- capture les 12 écrans de référence (`DEFAULT_ROUTES`) aux **quatre largeurs du
  contrat** : 390, 768, 1024, 1440 px ;
- **mesure** le débordement horizontal et relève les erreurs de console, au lieu
  de les estimer ;
- écrit `docs/screenshots/<largeur>/<slug>.png` et
  `docs/screenshots/rapport.md` ;
- sort en **code 3** si Playwright est absent (« rien mesuré »), en **code 1** si
  au moins un écran déborde ou lève une erreur.

## Ce qu'une capture doit montrer

| Largeur | Ce qui doit changer | Ce qui ne doit pas arriver |
| --- | --- | --- |
| 390 | barre d'onglets basse, contenu en une colonne | colonne plus large que l'écran, texte coupé |
| 768 | rail **replié** (72 px) à gauche, barre basse **disparue** | les deux navigations montées en même temps |
| 1024 | rail **dépliable** (236 px), colonne de lecture centrée | contenu collé au rail, largeur qui saute |
| 1440 | même coquille, marges qui grandissent | lignes de lecture de 1 400 px |

Une fois les captures produites, elles se versionnent dans ce dossier et le
tableau de `docs/plan/verification-manuelle.md` peut être coché — avec la date et
la personne, pas seulement la coche.

## Alternative sans navigateur

Ce qui **est** vérifié automatiquement, et qui remplace une partie du contrôle
visuel :

| Contrôle | Commande | Ce qu'elle prouve |
| --- | --- | --- |
| Jetons et contrastes | `node scripts/audit-plan.mjs` | 390 paires texte/fond ≥ 4,5:1 |
| Règles UX/UI | `node scripts/audit-playbook.mjs` | 77 règles mesurées dans la source |
| Mesures de colonne | `npx vitest run tests/design` | une seule mesure de lecture, un seul plafond |
| Coquilles | `tests/design/app-shells.test.ts` | une seule navigation montée par palier |

Ce que ces commandes ne remplacent pas : la lisibilité perçue, l'effet réel du
verre, et le geste sur un appareil. C'est exactement ce que les captures
apportent — d'où ce dossier vide plutôt qu'un dossier trompeur.
