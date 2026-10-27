# Scénario 13 — AI Coach Complet

**Persona**: Marie (Principal)
**Objectif**: Recevoir des recommandations intelligentes personnalisées
**Drive Force**: Want — Progrès optimisé / Fear — Stagnation
**Version**: v1.0
**Date**: 2026-08-03

---

## Journey Overview

```
[Home] → [AI Coach Tab]
    ↓
[Daily Plan Screen] (déjà existant)
    ↓
[RecommendationsScreen]
    ↓
[RecommendedExerciseScreen]
    ↓
[WeeklyReviewScreen]
```

---

## Design Intent

- **Personnalisation**: Adapté au profil unique de l'utilisateur
- **Proactivité**: Anticiper les besoins
- **Motivation**: Encourager la progression
- **Confiance**: Explications claires des recommandations

---

## Pages

| # | Page | Object ID | Status |
|---|------|-----------|--------|
| 1 | DailyPlanScreen | `vs-daily-plan-screen` | ✅ existant |
| 2 | RecommendationsScreen | `vs-recommendations-screen` | ✅ specified |
| 3 | RecommendedExerciseScreen | `vs-recommended-exercise-screen` | ✅ specified |
| 4 | WeeklyReviewScreen | `vs-weekly-review-screen` | ✅ specified |

---

## Capabilities Utilisées

- `AI Coach` — Intelligence artificielle
- `Analytics` — Données de performance
- `Memory` — État de mémorisation
- `FSRS` — Calculs de scheduling
