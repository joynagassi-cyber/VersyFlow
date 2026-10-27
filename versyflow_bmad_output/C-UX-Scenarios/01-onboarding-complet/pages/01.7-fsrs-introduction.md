# Page Specification — FSRS Introduction Screen

**Scenario**: 01 — Onboarding Complet
**Page**: 05
**Object ID**: `vs-fsrs-intro-screen`
**Date**: 2026-08-03

---

## 1. Page Basics

| Property | Value |
|----------|-------|
| Title | FSRS Introduction Screen |
| Route | `/onboarding/fsrs-intro` |
| User Goal | Comprendre ce qu'est FSRS et pourquoi c'est important |
| Entry Point | Translation Picker ( après sélection traduction) |
| Exit Point | Home |
| Device | Mobile |
| Mental State | Ouvert à apprendre, veut comprendre la valeur |

---

## 2. Layout Sections

### Section 1: Header (Primary)
- **Purpose**: Titre de l'écran
- **Priority**: Primary

### Section 2: Visual Explanation (Primary)
- **Purpose**: Illustration de la courbe d'oubli
- **Priority**: Primary

### Section 3: Benefits List (Primary)
- **Purpose**: Avantages de FSRS
- **Priority**: Primary

### Section 4: CTA (Primary)
- **Purpose**: Passer à l'action
- **Priority**: Primary

---

## 3. Components & Objects

### O-01: HeaderText
- **Type**: Text
- **Section**: Header
- **Description**: "La science de la mémorisation"
- **Object ID**: `vs-fsrs-header`

### O-02: CurveIllustration
- **Type**: SVG/Animated
- **Section**: Visual Explanation
- **Description**: Graphique courbe d'oubli vs FSRS
- **Object ID**: `vs-fsrs-curve`

### O-03: BenefitItem (x3)
- **Type**: Card
- **Section**: Benefits List
- **Description**: Chaque avantage FSRS
- **Object ID**: `vs-fsrs-benefit-{n}`

### O-04: StartButton
- **Type**: Button
- **Section**: CTA
- **Description**: "Commencer à mémoriser"
- **Object ID**: `vs-fsrs-start`

---

## 4. Content & Languages

### O-02 CurveIllustration
- **Sans FSRS**: Courbe d'oubli classique (diminution rapide)
- **Avec FSRS**: Courbe maintenue grâce aux rappels optimaux

### O-03 BenefitItems
| # | FR Title | FR Description | EN Title | EN Description |
|---|----------|----------------|----------|----------------|
| 1 | "Rythme optimal" | "FSRS calcule le meilleur moment pour réviser" | "Optimal timing" | "FSRS calculates the perfect review time" |
| 2 | "Moins de révisions" | "Revoyez moins souvent pour retenir plus longtemps" | "Fewer reviews" | "Review less often, remember longer" |
| 3 | "Scientifiquement prouvé" | "Basé sur des années de recherche en neuroscience" | "Proven science" | "Based on years of neuroscience research" |

### O-04 StartButton
| Language | Content |
|----------|---------|
| FR | "Commencer à mémoriser" |
| EN | "Start memorizing" |
| DE | "Beginnen Sie zu memorieren" |
| AR | "ابدأ الحفظ" |
| ZH | "开始记忆" |

---

## 5. Interactions

### O-04 StartButton
- **On tap**: Navigate to Home

---

## 6. States

| State | Trigger | Description |
|-------|---------|-------------|
| Default | Load | Contenu affiché |
| Animated | Entry | Animation de la courbe |

---

## 7. Spacing & Typography

| ID | Between | Size |
|----|---------|------|
| `vs-fsrs-v-space-lg` | Header → Curve | lg (24px) |
| `vs-fsrs-v-space-xl` | Curve → Benefits | xl (32px) |
| `vs-fsrs-v-space-xl` | Benefits → Button | xl (32px) |

---

## 8. Design Notes

- **Visuel**: Graphique simple, courbe d'oubli vs FSRS
- **Couleurs**: Rose pour FSRS, gris pour courbe classique
- **Animation**: La courbe FSRS reste stable, la classique descend
- **Optionnel**: Peut être skip si l'utilisateur est pressé