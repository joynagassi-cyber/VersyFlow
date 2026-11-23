# VersyFlow — Definition of Ready, Done & Checklists

> Document généré par le CEO Multi-Agent
> Ces critères sont IMMUABLES. Aucune tâche ne peut commencer sans DoR ni être marquée termine sans DoD.

---

## Definition of Ready (DoR)

Une tâche PEUT commencer UNIQUEMENT si TOUS ces critères sont remplis:

### Générique (toutes tâches)

- [ ] La documentation spec correspondante est lue (docs/01-* à docs/20-*)
- [ ] Le fichier à créer/modifier appartient au dossier de l'agent assigné ( MODULE_OWNERSHIP.md)
- [ ] Les tâches dont cette tâche dépend sont terminées (DEPENDENCY_GRAPH.md)
- [ ] L'agent sait exactement QUEL code produire (pas d'ambiguïté)
- [ ] Il existe un moyen de vérifier que le code fonctionne (test, compilation, lint)

### Spécifique: Tâches UI (Herald)

- [ ] Le screen/component est specifié dans 08-ui-screens.md
- [ ] Les composants requis existent déjà dans 06-design-system.md OU une tâche pour les créer existe
- [ ] Les tokens de design (couleurs, typo, spacing) sont exportés (S0-Forge-6 terminee)
- [ ] Les textes i18n correspondent ou une tâche pour les ajouter existe
- [ ] Le user flow correspondant est lu (04-user-flows.md)

### Spécifique: Tâches Domaine (Anvil)

- [ ] L'entité/type correspondante est définie dans 10-data-model.md
- [ ] L'interface de port correspondante existe (ex: IFsrsEngine)
- [ ] Les règles métier sont définies dans 20-domain-use-cases.md
- [ ] Les tests unitaires associés sont planifiés dans 18-test-strategy.md
- [ ] Les domain events liés sont listés dans 19-domain-events.md

### Spécifique: Tâches Data (Scribe)

- [ ] Le schéma JSON est défini dans 10-data-model.md
- [ ] Le validateur Zod existe ou une tâche pour le créer est planifiée
- [ ] Les données sont complets et valides (66 livres, tous chapitres, tous versets)

### Spécifique: Tâches i18n (Translator)

- [ ] Tous les textes à traduire sont extraits des écrans (Herald informe)
- [ ] Le format JSON de locale est connu (exemple dans 12-internationalization.md)
- [ ] La fallback chain est configurée

---

## Definition of Done (DoD)

Une tâche est TERMINEE UNIQUEMENT si TOUS ces critères sont remplis:

### Générique (toutes tâches)

- [ ] TypeScript compile sans erreur (`npm run typecheck` passe vert)
- [ ] ESLint passe sans warning (`npm run lint` passe vert)
- [ ] Le code respecte les conventions de nommage (16-ai-dev-guide.md R-AI-3)
- [ ] Commentaires expliquent le POURQUOI, pas le QUOI
- [ ] L'agent a posté une notification de finish: "[Agent Nom] Tâche terminée: [nom tâche]"

### Spécifique par couche

| Couche | Critères additionnels |
|--------|----------------------|
| Domaines | Tests unitaires écrits ET passant |
| Services | Tests integration écrits ET passant |
| UI Components | Rendu visuel conforme à 06-design-system.md |
| Ecrans (app/) | Navigation vers/depuis fonctionne, textestous i18n, accessibilité vérifiée |
| Hooks | Utilisable dans un écran sans erreurs |
| Tests | Couverture augmente (vérifié par Guardian) |
| i18n Locales | Clé présente dans TOUS les 5 fichiers .json |
| Data Bible | Validé par Zod, tous les livres/chapitres/versets présents |

### Règle d'or du Done

> Si un test existe mais échoue -> la tâche n'est PAS done.
> Si le code compile mais le linter echoue -> la tâche n'est PAS done.
> Si une fonctionnalité marche en dev mais pas en production build -> la tâche n'est PAS done.

---

## Pull Request Checklist

Avant chaque fusion (merge), le PR doit passer ces checks automatiques:

### Automatique (CI)

- [ ] `npm run typecheck` --- PASS
- [ ] `npm run lint` --- PASS
- [ ] `npm test` --- PASS (tous les tests existants)
- [ ] Coverage: nouvelle ligne de code >= 80% coverage
- [ ] Pas de fichiers modifiés hors du dossier assigné (Guardian vérifie)

### Manuel (humain ou agent senior)

- [ ] Le commit message suit Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Une seule responsabilité par PR (ne pas modifier 3 fichiers dans 3 couches)
- [ ] Aucune logique métier dans les composants UI (PA-1 vérifié)
- [ ] Aucun texte hardcodé (tous les textes visibles ont une clé t())
- [ ] Pas de traduction biblique codée en dur (PA-2 vérifié)
- [ ] Respect de la directionnalité des imports (PA-5 vérifié)
- [ ] Accessibilité: contrastes vérifiés, labels VoiceOver/TalkBack
- [ ] La documentation docs/08-execution/ est mise à jour si besoin

---

## Code Review Rules

### Architecture
- [ ] La couche du fichier respect e la règle de dépendance?
- [ ] L'import vient-il d'une couche inférieure?
- [ ] Pas de dépendance circulaire?

### Lisibilité
- [ ] Nommage conforme aux conventions (R-AI-3)?
- [ ] Fonctions courtes (< 40 lignes max)?
- [ ] Complexité cyclomatique <= 5?
- [ ] Pas de duplication (DRY)?

### Performance
- [ ] Pas de calcul lourd dans le render React?
- [ ] Pas de re-renders inutiles (React.memo sur composants fréquents)?
- [ ] Pas de内存 leaks (event listeners, intervals non cleanup)?

### Sécurité
- [ ] Pas de sécuisation d'entrée utilisateur non validée?
- [ ] Pas de localStorage/AsyncStorage avec données sensibles en clair?
- [ ] Les appels WASM sont wrapped dans try/catch?

### UX
- [ ] Feedback utilisateur visible pour toute action async?
- [ ] États loading/error/empty gérés?
- [ ] Touch targets >= 44x44pt?
- [ ] Animations respectent reduced motion preference?

---

*Ces critères s'appliquent à TOUTE modification de code. Aucune exception.*
