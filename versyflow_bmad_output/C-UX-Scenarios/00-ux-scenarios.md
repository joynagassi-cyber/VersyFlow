# VersyFlow — UX Scenarios Overview

**Projet**: VersyFlow MVP
**Date**: 2026-08-03
**Version**: v0.1

---

## Scénarios Définis

| # | Scénario | Persona | Objectif | Pages | Statut |
|---|----------|---------|----------|-------|--------|
| 01 | Onboarding Complet | Marie | Configuration initiale en < 60s | 4 | ✅ |
| 02 | Mémorisation d'un Verset | Marie | Mémoriser activement un verset | 5 | ✅ |
| 03 | Navigation Biblique | Étudiant | Parcourir la Bible et trouver un verset | 4 | ✅ |
| 04 | Révision FSRS | Marie | Réviser les versets au moment optimal | 4 | ✅ |
| 05 | Suivi de Progression | Étudiant | Visualiser sa progression | 3 | ✅ |
| 06 | Paramètres | Senior | Modifier ses préférences | 3 | ✅ |
| 07 | Cas d'Erreur | Tous | Gestion des erreurs et recovery | 4 | ✅ |

---

## Coverage Matrix

| Feature | S01 | S02 | S03 | S04 | S05 | S06 | S07 |
|---------|-----|-----|-----|-----|-----|-----|-----|
| Onboarding | ✅ | | | | | | |
| Language Picker | ✅ | | | | | | |
| Translation Picker | ✅ | | | | | | |
| Bible Navigation | | | ✅ | | | | |
| Book List | | | ✅ | | | | |
| Chapter List | | | ✅ | | | | |
| Verse List | | | ✅ | | | | |
| Reference Search | | | ✅ | | | | |
| Memorization Session | | ✅ | | | | | |
| Progressive Mask | | ✅ | | | | | |
| Tap-to-Reveal | | ✅ | | | | | |
| FSRS Engine | | | | ✅ | | | |
| Review Queue | | | | ✅ | | | |
| Auto-reveal | | | | ✅ | | | |
| Progress Dashboard | | | | | ✅ | | |
| Stats Grid | | | | | ✅ | | |
| Weekly Chart | | | | | ✅ | | |
| Settings | | | | | | ✅ | |
| Reset Progress | | | | | | ✅ | |
| No Internet | | | | | | | ✅ |
| FSRS Fallback | | | | | | | ✅ |
| DB Corruption | | | | | | | ✅ |

---

## Scenario Index

| Scénario | Fichier | Pages |
|----------|---------|-------|
| 01 — Onboarding Complet | [01-onboarding-complet.md](01-onboarding-complet/01-onboarding-complet.md) | 4 |
| 02 — Mémorisation d'un Verset | [02-memorisation-verset.md](02-memorisation-verset/02-memorisation-verset.md) | 5 |
| 03 — Navigation Biblique | [03-navigation-biblique.md](03-navigation-biblique/03-navigation-biblique.md) | 4 |
| 04 — Révision FSRS | [04-revision-fsrs.md](04-revision-fsrs/04-revision-fsrs.md) | 4 |
| 05 — Suivi de Progression | [05-suivi-progression.md](05-suivi-progression/05-suivi-progression.md) | 3 |
| 06 — Paramètres | [06-parametres.md](06-parametres/06-parametres.md) | 3 |
| 07 — Cas d'Erreur | [07-cas-erreur.md](07-cas-erreur/07-cas-erreur.md) | 4 |

**Total: 27 pages**