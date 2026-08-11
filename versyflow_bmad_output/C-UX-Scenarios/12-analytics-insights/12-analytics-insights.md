# Scénario 12 — Analytics & Insights

**Persona**: Étudiant en théologie (Principal)
**Objectif**: Comprendre sa progression et ses patterns d'apprentissage
**Drive Force**: Want — Amélioration continue / Fear — Stagnation
**Version**: v1.0
**Date**: 2026-08-03

---

## Journey Overview

```
[Home] → [Progress Tab]
    ↓ (tap analytics)
[Analytics Dashboard]
    ↓ (select metric)
[RetentionAnalyticsScreen] ou [LearningTimeScreen] ou [DifficultyAnalyticsScreen]
    ↓
[InsightsScreen] (recommandations IA)
```

---

## Design Intent

- **Clarté**: Données faciles à comprendre
- **Actionnable**: Insights qui motivent à agir
- **Historique**: Voir l'évolution dans le temps
- **Personnalisation**: Adapté au profil de l'utilisateur

---

## Pages

| # | Page | Object ID | Status |
|---|------|-----------|--------|
| 1 | RetentionAnalyticsScreen | `vs-retention-analytics-screen` | ✅ specified |
| 2 | LearningTimeScreen | `vs-learning-time-screen` | ✅ specified |
| 3 | DifficultyAnalyticsScreen | `vs-difficulty-analytics-screen` | ✅ specified |
| 4 | InsightsScreen | `vs-insights-screen` | ✅ specified |

---

## Capabilities Utilisées

- `Analytics` — Calcul et visualisation des données
- `AI Coach` — Recommandations basées sur l'analyse
- `Memory` — Données de mémorisation
- `Comparison` — Données de comparaison
