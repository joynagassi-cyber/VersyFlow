# VersyFlow — VCC Command Center

> Système de Gouvernance et d'Automatisation — Cellule 7: Knowledge Control
> Ce document est LE système d'exploitation du projet VersyFlow.

---

## Vue d'Ensemble

Le VCC est maintenant actif avec 7 cellules spécialisées qui couvrent l'intégralité du cycle de vie du développement.

### Architecture du Système

```
                    ┌─────────────────────────────┐
                    │   VERSYFLOW COMMAND CENTER    │
                    │         (VCC - vous)          │
                    └───────────┬───────────────────┘
         ┌──────────┬──────────┼──────────┬──────────┐
         │          │          │          │          │
    ┌────▼────┐ ┌──▼────┐ ┌──▼────┐ ┌──▼────┐ ┌──▼────┐
    │ Cell 1: │ │Cell 2 │ │Cell 3 │ │Cell 4 │ │Cell 5 │
    │Program  │ │Arch   │ │Quality│ │Product│ │ Memory│
    │Control  │ │Control│ │Control│ │Control│ │Science│
    └────┬────┘ └──┬────┘ └──┬────┘ └──┬────┘ └──┬────┘
         │         │         │         │         │
    ┌────▼────┐ ┌──▼────┐ ┌──▼────┐ ┌──▼────┐ ┌──▼────┐
    │Cell 6:  │ │Cell 7:│ │...    │ │...     │ │...     │
    │Release  │ │Knowl  │ │       │ │        │ │        │
    │Control  │ │Control│ │       │ │        │ │        │
    └─────────┘ └───────┘ └───────┘ └────────┘ └────────┘

    Les 7 cellules coordonnent automatiquement:
    - Planification → Exécution → Validation → Intégration → Mesure → Amélioration
```

---

## Documents Générés par le VCC

### 1. MASTER_BACKLOG.md
- **Source**: PRD + Features + Implementation Plan
- **Mise à jour**: Auto lors de chaque sprint
- **Agit comme**: Backlog canonique unique, atomique, priorisé

### 2. KANBAN_BOARD.md
- **Source**: MASTER_BACKLOG.md + Sprint Review
- **Mise à jour**: Auto après chaque merge/commit
- **Agit comme**: Tableau visuel synchronisé

### 3. DEPENDENCY_DIAGRAM.md
- **Source**: EXECUTION_ROADMAP.md + DEPENDENCY_GRAPH.md + architecture
- **Mise à jour**: Auto quand nouvelles tâches ajoutées au backlog
- **Agit comme**: Graphique de dépendances en temps réel

### 4. CHANGELOG.md
- **Source**: Commits Git + PR merge history
- **Mise à jour**: Auto-généré à partir des commits (Conventional Commits)
- **Agit comme**: Historique structuré des versions

### 5. METRICS_DASHBOARD.md
- **Source**: Tous les documents + CI pipeline + codebase scan
- **Mise à jour**: Après chaque sprint ou commit critique
- **Agit comme**: Dashboard de santé du projet en temps réel

### 6. ARCHITECTURE_DECISION_RECORDS.md
- **Source**: Décisions architecturales prises pendant développement
- **Mise à jour**: À chaque décision majeure (>2h impact)
- **Agit comme**: Historique des choix architecturaux justifiés

---

## Cycle d'Exécution VCC

### Step 1: OBSERVER
Scanner automatiquement:
- Status du backlog (quelles tâches sont prêtes/blockées)
- Health du code (compilation, lint, tests)
- Violations architecture (imports interdits, anti-patterns)
- Risques ouverts (risque register mis à jour?)

### Step 2: ANALYSER
Comparer état actuel vs cible sprint:
- Progression réelle vs planification
- Taux de blocage
- Qualité du code (couverture, complexité)
- Dette technique accumulée

### Step 3: PRIORISER
Appliquer hiérarchie décisionnelle:
1. Sécurité architecture (Constitution + rulebooks)
2. Stabilité harnais technique
3. Chemin critique MVP
4. Tests nécessaires
5. Rétention/mémorisation cœur métier
6. UX polish
7. Performance optimization

### Step 4: DÉCOUPER
Vérifier que chaque tâche est atomique:
- < 2h de travail estimé
- Testable indépendant
- Propriétaire unique assigné
- Dépendances explicites tracées

### Step 5: ASSIGNER
Assigner aux agents selon MODULE_OWNERSHIP.md:
- Aucun chevauchement de fichiers possible
- Chaque agent connaît ses limites
- Communication via protocols établis

### Step 6: SUPERVISER
Monitorer en temps réel:
- Progression des tâches
- Blocages détectés automatiquement
- Violations signalées immédiatement
- Qualité mesurée continuellement

### Step 7: VÉRIFIER
Validate avant integration:
- Compilation passe
- Lint + typecheck vert
- Tests passent (couverture ≥ seuil)
- Architecture respects rules
- i18n coverage complet
- Accessibilité vérifiée

### Step 8: INTÉGRER
Merge uniquement si:
- Toutes les gates passées
- Code review passé
- Documentation mise à jour
- Aucune violation détectée

### Step 9: MESURER
After integration:
- Update metrics dashboard
- Update changelog
- Update kanban board
- Track velocity

### Step 10: AMÉLIORER
Continuous improvement:
- Retro sprint findings
- Process adjustments
- Rulebook refinements
- Risk mitigation updates

---

## Règles de Blocage Automatique

Le VCC arrête IMMÉDIATEMENT le développement si:

| Condition | Action | Severity |
|-----------|--------|----------|
| Violation Constitution | STOP + Alert Guardian | CRITICAL |
| Import direction interdit | BLOCK merge | HIGH |
| Domain Event supprimé sans justification | STOP + Alert all agents | CRITICAL |
| Module sans propriétaire | Reassign before continuing | MEDIUM |
| Regression critique détectée | Rollback + Alert | HIGH |
| Backlog incohérent (tâche sans owner/deps) | BLOCK before assignment | MEDIUM |
| Quality Gate échoue | BLOCK merge | HIGH |

---

## Auto-surveillance — Rapports Automatiques

### Génération automatique à chaque fin de sprint:

1. **Sprint Review** — Ce qui a été accompli vs planned
2. **Sprint Retrospective** — Lessons learned, process improvements
3. **Health Report** — Project health score (code quality, architecture compliance)
4. **Risk Report** — Updated risk register with new risks identified
5. **Architecture Report** — Any violations detected, debt accumulated
6. **Product Report** — Features completed, UX quality assessed
7. **Technical Debt Report** — New debt introduced, existing debt status
8. **Release Readiness Report** — Is the project ready for next release?

---

## Politiques de Travail Multi-Agent

### Règles de Coordination

1. **Un agent = Un module**
   - Ownership exclusif vérifié avant toute tâche
   - Impossible pour 2 agents d'écrire le même fichier

2. **Communication structurée**
   - Finish notifications postées publiquement
   - Block notifications alertent tous les agents concernés
   - Audit findings de Guardian sont bloqueants

3. **Resolution de conflits**
   ```
   Conflit détecté
       ↓
   Identifier source du conflit
       ↓
   Consulter MODULE_OWNERSHIP.md
       ↓
   Si propriétaire identifié → Résoudre entre agents
       ↓
   Sinon → Escalade à Guardian
       ↓
   Guardian arbitre selon Constitution + rulebooks
       ↓
   Décision enregistrée dans ADR
       ↓
   Résolution appliquée, reprise exécution
   ```

4. **Escalade automatique**
   - 3 retries échoués → escalade humaine (si disponible)
   - Violation architecture → escalation immédiate Guardian
   - Build cassé > 30min → alerte TOUS les agents

---

## Métriques de Santé du Projet

| Catégorie | Indicateur | Valeur Actuelle | Cible | Statut |
|-----------|-----------|----------------|-------|--------|
| Product | MVP Features Complete | 0% | 100% (Sprint 5) | 🟡 On track |
| Architecture | Clean Arch Violations | 0 | 0 | ✅ |
| Code Quality | TypeScript Compiles | ✅ Yes | — | ✅ |
| Tests | Unit Coverage | 0% | 90% domains | ⚠️ Next sprint |
| Docs | Spec Docs Complete | 35/35 | 35+ | ✅ |
| Governance | Quality Gates Passing | N/A (no builds yet) | 10/10 | ⏳ Pending |
| Velocity | Sprint 0 Completion | 82% | 100% | 🟡 |

---

## Prochaines Étapes

1. **Commencer Sprint 1** — Une fois que les blockers P0 sont résolus:
   - [ ] LSG.json créé (~31K versets)
   - [ ] MMKV runtime wired
   - [ ] AR/DE/ZH locales traduites (Translator)

2. **Lancer Sprint 1** — 5 agents actifs simultanément:
   - Herald: Écrans onboarding + bible navigation
   - Scribe: LSG.json data file + FsrsService
   - Translator: Terminer 3 locales restantes
   - Anvil: Stores connexion + services
   - Guardian: Monitor architecture + emit events

3. **Maintenir Dashboard** — Mise à jour automatique à chaque merge

---

*VCC Command Center activé le 2026-07-27*
*Prochaine activation automatique: Fin de Sprint 1*
*Statut: MONITORING ACTIVE — Prêt pour Sprint 1*
