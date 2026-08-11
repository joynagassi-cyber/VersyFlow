# Scénario 11 — FSRS Avancé

**Persona**: Marie (Principal)
**Objectif**: Visualiser et planifier les révisions FSRS
**Drive Force**: Want — Optimisation / Fear — Oubli
**Version**: v1.0
**Date**: 2026-08-03

---

## Journey Overview

```
[Home] → [Review Queue]
    ↓ (tap calendrier)
[ReviewCalendarScreen]
    ↓
[ScheduleScreen]
    ↓
[Home]
```

---

## Design Intent

- **Visualisation**: Calendrier clair des révisions
- **Planification**: Voir l'avenir des rappels
- **Contrôle**: Ajuster les intervals manuellement
- **Motivation**: Voir la progression dans le temps

---

## Pages

| # | Page | Object ID | Status |
|---|------|-----------|--------|
| 1 | ReviewCalendarScreen | `vs-review-calendar-screen` | ✅ specified |
| 2 | ScheduleScreen | `vs-schedule-screen` | ✅ specified |

---

## Capabilities Utilisées

- `FSRS` — Moteur de calcul des intervals
- `Analytics` — Statistiques de révision
- `Memory` — Suivi des mémorisations
