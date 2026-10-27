# VersyFlow — Feature Impact Analysis

**Projet**: VersyFlow MVP
**Date**: 2026-08-03

---

## Feature → Persona Mapping

| Feature | Marie (Principal) | Étudiant (Secondary) | Senior (Tertiary) |
|---------|-------------------|---------------------|-------------------|
| Onboarding | 🔴 HIGH | 🟡 MEDIUM | 🔴 HIGH |
| Bible Navigation | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM |
| Memorization Session | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM |
| FSRS Engine | 🟡 MEDIUM | 🔴 HIGH | 🟢 LOW |
| Review Queue | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM |
| Progress Dashboard | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM |
| Settings | 🟡 MEDIUM | 🟡 MEDIUM | 🔴 HIGH |
| RTL Support | 🟡 MEDIUM | 🟢 LOW | 🟡 MEDIUM |
| i18n (5 langues) | 🟡 MEDIUM | 🔴 HIGH | 🟢 LOW |

---

## Feature → Business Goal Impact

| Feature | Mémorisation Scientifique | Expérience Élégante | Offline-First |
|---------|--------------------------|---------------------|---------------|
| Onboarding | 🟢 | 🔴 HIGH | 🟢 |
| Bible Navigation | 🟡 | 🟡 | 🟢 |
| Memorization Session | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH |
| FSRS Engine | 🔴 HIGH | 🟡 | 🟢 |
| Review Queue | 🔴 HIGH | 🟡 | 🟢 |
| Progress Dashboard | 🟡 | 🔴 HIGH | 🟢 |
| Settings | 🟡 | 🟡 | 🔴 HIGH |

---

## Feature → Driving Force Mapping

| Feature | Want: Mémorisation Durable | Want: Beauté | Want: Accessibilité | Fear: Découragement | Fear: Confusion |
|---------|---------------------------|--------------|---------------------|---------------------|-----------------|
| Onboarding | 🟡 | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH | 🔴 HIGH |
| Bible Navigation | 🟡 | 🟡 | 🔴 HIGH | 🟢 LOW | 🟡 MEDIUM |
| Memorization Session | 🔴 HIGH | 🔴 HIGH | 🟡 MEDIUM | 🟡 MEDIUM | 🟡 MEDIUM |
| FSRS Engine | 🔴 HIGH | 🟡 | 🟢 LOW | 🟡 MEDIUM | 🟢 LOW |
| Review Queue | 🔴 HIGH | 🟡 | 🟢 LOW | 🔴 HIGH | 🟢 LOW |
| Progress Dashboard | 🟡 | 🔴 HIGH | 🟡 MEDIUM | 🔴 HIGH | 🟢 LOW |
| Settings | 🟡 | 🟡 | 🔴 HIGH | 🟢 LOW | 🔴 HIGH |

---

## Priority Matrix

```
HIGH IMPACT |  Memorization  |  FSRS Engine   |  Review Queue  |  Onboarding
            |                |                |                |
            |  Progress      |                |                |  Bible Nav
MEDIUM IMPACT|                |                |                |
            |  Settings      |                |                |
            |                |                |                |
LOW IMPACT  |                |                |                |
```

---

## Gap Analysis

### Features Missing but Needed
| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Export/Import data | MEDIUM | V1+ — pour migration entre téléphones |
| Verset du jour | MEDIUM | V1+ — engagement quotidien |
| Favoris visuels | LOW | MVP — déjà dans specs |
| Deep linking | LOW | V1+ — partage de versets |

### Features Over-Specified
| Feature | Issue | Recommendation |
|---------|-------|----------------|
| Advanced stats | Too complex for MVP | Simplify to basic dashboard |
| Multi-translation | Heavy for MVP | MVP = LSG only, V1+ multi |

---