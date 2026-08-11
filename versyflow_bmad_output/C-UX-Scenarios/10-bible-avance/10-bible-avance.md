# Scénario 10 — Bible Avancée

**Persona**: Étudiant en théologie (Principal), Chrétien senior (Secondaire)
**Objectif**: Explorer la Bible en profondeur avec recherche avancée et collections
**Drive Force**: Want — Compréhension approfondie / Fear — Perdre le fil
**Version**: v1.0
**Date**: 2026-08-03

---

## Journey Overview

```
[Home] → [Bible Explorer]
    ↓ (search ou navigation)
[Search Screen] ou [VerseSelectionScreen]
    ↓
[VerseReaderScreen]
    ↓ (actions)
[FavoritesScreen] ou [CollectionsScreen]
    ↓
[CrossReferencesScreen] (V1)
    ↓
[NotesScreen] (V1)
```

---

## Design Intent

- **Profondeur**: Accès rapide à tous les livres/chapitres
- **Contexte**: Références croisées intégrées
- **Personnalisation**: Collections personnelles
- **Recherche**: Trouver rapidement n'importe quel verset

---

## Pages

| # | Page | Object ID | Status |
|---|------|-----------|--------|
| 1 | VerseSelectionScreen | `vs-verse-select-screen` | ✅ specified |
| 2 | VerseReaderScreen | `vs-verse-reader-screen` | ✅ specified |
| 3 | SearchScreen | `vs-search-screen` | ✅ specified |
| 4 | CollectionsScreen | `vs-collections-screen` | ✅ specified |
| 5 | CrossReferencesScreen | `vs-cross-refs-screen` | V1 conceptuel |

---

## Navigation Map

```
BibleExplorer
    ↓ (tap livre)
BookList
    ↓ (tap chapitre)
ChapterList
    ↓ (tap verset)
VerseSelectionScreen → VerseReaderScreen
    ↓
├── SearchScreen
├── FavoritesScreen
└── CollectionsScreen
```

---

## Capabilities Utilisées

- `Bible` — Navigation et recherche
- `Memory` — Mémorisation depuis le reader
- `Comparison` — Comparaison de traductions
