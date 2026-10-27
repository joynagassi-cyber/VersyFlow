# Scénario 06: Paramètres

**Persona**: Chrétien senior (Tertiaire)
**Objectif**: Modifier les préférences de l'application
**Drive Force**: Want — Accessibilité / Fear — Confusion

---

## Journey Overview

```
[Home]
    ↓ (tap tab Paramètres)
[Settings Screen]
    ↓ (tap option)
[Setting Action Screen]
    ↓
[Settings Screen] (updated)
```

---

## Page 01: Settings Screen

### Contexte
- **Entry**: Tab Paramètres
- **Goal**: Accéder à toutes les préférences
- **Exit**: Tap option ou retour Home

### Layout
```
┌─────────────────────────┐
│  "Paramètres"           │
│                         │
│  ── Général ────────────│
│  ┌─────────────────────┐│
│  │ 🌐 Langue interface ││
│  │    Français         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 📖 Traduction Bible ││
│  │    LSG              ││
│  └─────────────────────┘│
│                         │
│  ── Apparence ──────────│
│  ┌─────────────────────┐│
│  │ 🎨 Thème            ││
│  │    Clair (V1+)      ││
│  └─────────────────────┘│
│                         │
│  ── Données ────────────│
│  ┌─────────────────────┐│
│  │ 💾 Stockage utilisé ││
│  │    12.5 MB          ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 📤 Exporter données ││
│  └─────────────────────┘│
│                         │
│  ── À propos ───────────│
│  ┌─────────────────────┐│
│  │ ℹ️ Version app      ││
│  │    v0.1.0           ││
│  └─────────────────────┘│
│                         │
│  ── Danger Zone ────────│
│  ┌─────────────────────┐│
│  │ 🗑️ Réinitialiser    ││
│  │    progression      ││
│  └─────────────────────┘│
│                         │
└─────────────────────────┘
│  [🏠]  [🔍]  [📊]  [⚙️]│
└─────────────────────────┘
```

### Composants
- `SettingsGroup`: Sections (Général, Apparence, Données, À propos, Danger)
- `SettingRow`: Ligne avec icône, titre, valeur, chevron
- `SettingRowDestructive`: Ligne rouge pour actions destructives
- `SectionHeader`: Titre de section

### Interactions
- Tap row → navigate to setting action or inline change
- Tap destructive → confirmation modal

### États
- **Loading**: Skeleton screens
- **Live update**: Changement immédiat sans restart
- **RTL**: Direction auto si arabe sélectionné

---

## Page 02: Language Picker (Settings)

### Contexte
- **Entry**: From Settings (tap Langue)
- **Goal**: Changer la langue de l'interface
- **Exit**: Selection → apply + return

### Layout
```
┌─────────────────────────┐
│  [← Paramètres]         │
│                         │
│  "Langue de l'interface"│
│                         │
│  ┌───────────────────┐  │
│  │ 🇫🇷 Français      │  │
│  │     ✓ Sélectionné │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇬🇧 English       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇩🇪 Deutsch       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇸🇦 العربية       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🇨🇳 中文          │  │
│  └───────────────────┘  │
│                         │
│  [Appliquer]            │
└─────────────────────────┘
```

### Composants
- `LanguageList`: Liste des 5 langues
- `LanguageCard`: Carte avec drapeau, nom natif, sélection
- `ApplyButton`: Bouton appliquer

### Interactions
- Tap langue → sélection mise à jour
- Tap "Appliquer" → changement live + retour settings

### États
- **Selected**: Bordure rose + checkmark
- **RTL detected**: Si arabe → app passe en RTL
- **Applying**: Loading state pendant changement

---

## Page 03: Translation Picker (Settings)

### Contexte
- **Entry**: From Settings (tap Traduction)
- **Goal**: Changer la traduction biblique
- **Exit**: Selection → apply + return

### Layout
```
┌─────────────────────────┐
│  [← Paramètres]         │
│                         │
│  "Traduction biblique"  │
│                         │
│  ┌───────────────────┐  │
│  │ 📖 LSG           │  │
│  │ Louis Segond 1910 │  │
│  │ ✓ Sélectionné     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 📖 KJV           │  │
│  │ King James 1611   │  │
│  │ (V1+)             │  │
│  └───────────────────┘  │
│                         │
│  [Appliquer]            │
└─────────────────────────┘
```

### Composants
- `TranslationList`: Liste des traductions
- `TranslationCard`: Carte avec nom, année, style, sélection
- `ApplyButton`: Bouton appliquer

### Interactions
- Tap traduction → sélection mise à jour
- Tap "Appliquer" → swap traduction live + retour

### États
- **Downloading**: Si nouvelle traduction non présente
- **Error**: Reset to LSG si échec

---

## Page 04: Reset Confirmation Modal

### Contexte
- **Entry**: From Settings (tap Réinitialiser)
- **Goal**: Confirmer la suppression destructive
- **Exit**: Confirm or cancel

### Layout
```
┌─────────────────────────┐
│                         │
│      ⚠️                 │
│                         │
│  Réinitialiser la      │
│  progression?           │
│                         │
│  Cela supprimera:       │
│  • Tous les versets     │
│    mémorisés            │
│  • L'historique de      │
│    révisions            │
│  • Votre streak         │
│                         │
│  Tapez "SUPPRIMER" pour │
│  confirmer               │
│                         │
│  ┌───────────────────┐  │
│  │ [SUPPRIMER]       │  │
│  └───────────────────┘  │
│                         │
│  [Annuler]              │
│                         │
└─────────────────────────┘
```

### Composants
- `ModalOverlay`: Modal plein écran
- `WarningIcon`: Icône avertissement
- `ConfirmationText`: Instructions de confirmation
- `TextInput`: Input pour taper "SUPPRIMER"
- `ConfirmButton`: Bouton confirmer (disabled until text matches)
- `CancelButton`: Bouton annuler

### Interactions
- Tap input → focus + clavier
- Tap "SUPPRIMER" → bouton activé
- Tap "Confirmer" → reset + toast + retour settings
- Tap "Annuler" → fermer modal

### États
- **Idle**: Input vide, bouton désactivé
- **Typing**: Utilisateur tape
- **Match**: Texte correspond, bouton activé
- **Confirming**: Loading pendant reset
- **Reset**: Toast confirmation + retour settings