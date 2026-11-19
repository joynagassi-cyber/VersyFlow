# VersyFlow — Project Dashboard

> Document généré par le CEO Multi-Agent
> Ce dashboard est MIS À JOUR par Guardian à chaque fin de sprint.

---

## Stats Globales

| Metric | Valeur |
|--------|--------|
| Nombre total de tâches (Sprints 0-5) | ~66 |
| Nombre de modules | 12 |
| Nombre d'agents | 6 |
| Temps estimé total | ~66 jours ouvrés (6 agents) |
| Temps estimé (1 dev solo) | ~130 jours ouvrés |
| Economie parallelisation | ~50% |
| Chemin critique | S0 → S1-LSG → S2-WASM → S2-Memorization → S3-Review → S4 → S5 |
| % Parallélisation possible | ~55% (36 des 66 tâches) |
| Risque global MVP | MOYEN (WASM compilation + LSG.json completeness = seuls risques HIGH) |
| Couverture documentaire | 20 specs + 8 execution docs |
| Couverture tests planifiée | 90% domains, 70% services |

---

## Progress par Sprint

### Sprint 0 — Fondations
- **Statut**: A faire
- **Agents**: Forge, Anvil
- **Tâches**: 14
- **Jours**: 10
- **Blockers potentiels**: Aucun (toutes les dépendances sont ZERO)

### Sprint 1 — Onboarding + Bible Navigation
- **Statut**: A faire
- **Agents**: Herald, Scribe, Translator, Guardian
- **Tâches**: ~20
- **Jours**: 10
- **Dépendance bloquante**: S0 complet + LSG.json complet

### Sprint 2 — Mémorisation + FSRS
- **Statut**: A faire
- **Agents**: Forge, Anvil, Scribe, Guardian
- **Tâches**: ~14
- **Jours**: 15
- **Dépendance bloquante**: IFsrsEngine (S0) + WASM (S2-Forge)

### Sprint 3 — Révisions + Statistiques
- **Statut**: A faire
- **Agents**: Anvil, Scribe, Herald, Guardian
- **Tâches**: ~12
- **Jours**: 10
- **Dépendance bloquante**: FSRS Service (S2)

### Sprint 4 — Polish + Tests
- **Statut**: A faire
- **Agents**: Herald, Anvil, Scribe, Translator, Guardian
- **Tâches**: ~16
- **Jours**: 15
- **Dépendance bloquante**: Sprint 3 complet

### Sprint 5 — Beta Release
- **Statut**: A faire
- **Agents**: Forge, Herald
- **Tâches**: 4
- **Jours**: 6
- **Dépendance bloquante**: Sprint 4 complet

---

## Risk Register Summary

| Risk | Probabilité | Impact | Mitigation | Proprietaire |
|------|------------|--------|------------|-------------|
| WASM compilation échoue | Faible | HIGH | Fallback SM-2 JS existe | Forge |
| LSG.json incomplet | Moyen | HIGH | Zod validation + fallback | Scribe |
| Traductions manquantes | Moyen | Moyen | Translator review Sprint 4 | Translator |
| Tests E2E flaky | Moyen | Moyen | Prioriser unitaires | Anvil |
| Performance versets nombreux | Faible | Moyen | FlashList dès Sprint 1 | Herald |
| RTL breaks production | Faible | Moyen | Test arabe dès Sprint 1 | Herald |
| Conflits inter-agents | Très faible | Faible | Ownership exclusifs par dossier | Guardian |

---

*Dashboard mis à jour par Guardian à chaque sprint.*
