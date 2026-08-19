# Scénario 09 — Mémorisation Avancée

**Persona**: Marie (Principal), Étudiant (Secondaire)
**Objectif**: Explorer les différentes stratégies de mémorisation adaptées à chaque style d'apprentissage
**Drive Force**: Want — Maîtrise durable / Fear — Mauvaise méthode
**Version**: v1.0
**Date**: 2026-08-03

---

## Journey Overview

```
[Home] → [Memorization Start Screen]
    ↓ (sélection stratégie)
[GuidedRepeat Screen] ou [SentenceMode Screen] ou [WordMode Screen]
    ↓ (mode choisi)
[ProgressiveMask Screen] ou [RandomMask Screen]
    ↓ (validation)
[Dictation Screen] (optionnel)
    ↓
[Confirmation Screen]
    ↓
[Home]
```

---

## Design Intent

- **Flexibilité**: Chaque utilisateur trouve sa méthode optimale
- **Progression**: Du guidé au libre, adaptation automatique
- **Feedback**: Instructions claires à chaque étape
- **Flow**: Transition fluide entre les modes sans friction

---

## Pages

| # | Page | Object ID | Status |
|---|------|-----------|--------|
| 1 | MemorizationStartScreen | `vs-mem-start-screen` | ✅ specified |
| 2 | GuidedRepeatScreen | `vs-guided-repeat-screen` | ✅ specified |
| 3 | SentenceModeScreen | `vs-sentence-mode-screen` | ✅ specified |
| 4 | WordModeScreen | `vs-word-mode-screen` | ✅ specified |
| 5 | ProgressiveMaskScreen | `vs-progressive-mask-screen` | ✅ specified |
| 6 | RandomMaskScreen | `vs-random-mask-screen` | ✅ specified |
| 7 | DictationScreen | `vs-dictation-screen` | ✅ specified |

---

## Navigation Map

```
MemorizationStartScreen
    ↓ (tap stratégie)
├── GuidedRepeatScreen → Confirmation
├── SentenceModeScreen → WordModeScreen → Confirmation
├── WordModeScreen → ProgressiveMask → Confirmation
├── ProgressiveMaskScreen → Confirmation
├── RandomMaskScreen → Confirmation
├── FillMissingScreen → Confirmation (déjà existant)
└── DictationScreen → ComparisonResult → Confirmation
```

---

## Screens Covered

- **09.1** — MemorizationStartScreen (nouveau)
- **09.2** — GuidedRepeatScreen (nouveau)
- **09.3** — SentenceModeScreen (nouveau)
- **09.4** — WordModeScreen (nouveau)
- **09.5** — ProgressiveMaskScreen (nouveau)
- **09.6** — RandomMaskScreen (nouveau)
- **09.7** — DictationScreen (V1, conceptuel)

---

## Capabilities Utilisées

- `Memory` — Stratégies de mémorisation multiples
- `Comparison` — Vérification des réponses
- `Analytics` — Tracking des performances par mode
