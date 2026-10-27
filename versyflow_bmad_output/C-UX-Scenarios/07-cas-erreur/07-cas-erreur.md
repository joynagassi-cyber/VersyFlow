# Scénario 07: Cas d'Erreur et Recovery

**Persona**: Tous les personas
**Objectif**: Gérer les erreurs gracefully sans frustrer l'utilisateur
**Drive Force**: Fear — Confusion / Fear — Perte de données

---

## Journey Overview

```
[Any screen]
    ↓ (error occurs)
[Error State]
    ↓ (user action)
[Recovery] → [Normal Flow]
```

---

## Page 01: No Internet State

### Contexte
- **Trigger**: User tries online action (future feature)
- **State**: App works 100% offline, no error shown
- **Exit**: N/A — no action needed

### Behavior
- **Aucun message d'erreur** — l'app fonctionne toujours
- **Pas d'indicateur "no internet"** — c'est implicite
- **Future features** (sync, share) disabled with tooltip

### Layout
```
┌─────────────────────────┐
│                         │
│  (Feature unavailable)  │
│                         │
│  [Fonctionnalité à      │
│   venir — V1+]          │
│                         │
└─────────────────────────┘
```

---

## Page 02: FSRS Fallback State

### Contexte
- **Trigger**: WASM module fails to load
- **State**: Fallback SM-2 algorithm activated
- **Exit**: Automatic, user not notified

### Behavior
- **Auto-fallback** à SM-2 JS
- **Log event** pour analytics
- **Continue normally** — user experience unchanged
- **Retry on next launch** with exponential backoff

### Layout
```
┌─────────────────────────┐
│  (No visible change)    │
│                         │
│  [FSRS loaded via JS    │
│   fallback]             │
│  (logged internally)    │
│                         │
└─────────────────────────┘
```

---

## Page 03: Database Corruption Recovery

### Contexte
- **Trigger**: Local database corrupted on launch
- **State**: Auto-backup restoration offered
- **Exit**: Restore or start fresh

### Layout
```
┌─────────────────────────┐
│                         │
│      ⚠️                 │
│                         │
│  Base de données        │
│  endommagée             │
│                         │
│  Une sauvegarde         │
│  automatique est        │
│  disponible.            │
│                         │
│  Restaurer la         │
│  sauvegarde?            │
│                         │
│  [Restaurer] [Commencer │
│            à zéro]      │
│                         │
└─────────────────────────┘
```

### Composants
- `ModalOverlay`: Modal d'erreur
- `WarningIcon`: Icône avertissement
- `RestoreButton`: Restaurer depuis backup
- `FreshStartButton`: Commencer à zéro

### Interactions
- Tap "Restaurer" → restore backup + reload app
- Tap "Commencer à zéro" → clear data + onboarding again

### États
- **Detecting**: Check backup availability
- **Available**: Modal with restore option
- **Not available**: Modal with fresh start only
- **Restoring**: Loading spinner
- **Restored**: App restart

---

## Page 04: Verse Not Found

### Contexte
- **Trigger**: User searches for invalid reference
- **State**: Toast notification + redirect
- **Exit**: Return to search or navigation

### Layout
```
┌─────────────────────────┐
│  [Toast]                │
│  ┌─────────────────┐    │
│  │ ⚠️ Verset non   │    │
│  │    disponible    │    │
│  └─────────────────┘    │
│                         │
│  (Redirect to chapter)  │
│                         │
└─────────────────────────┘
```

### Behavior
- **Toast notification**: "Verset non disponible dans cette traduction"
- **Auto-redirect**: Back to chapter list
- **3 seconds**: Toast auto-dismiss

### États
- **Showing**: Toast visible
- **Dismissed**: Retour navigation normale
- **Retry**: User can search again

---

## Navigation Map (Error Handling)

```
Error Detection
    ↓
[No Internet] → No action (offline-first)
[FSRS Fallback] → Auto fallback (silent)
[DB Corruption] → Modal: Restore or Fresh Start
[Verse Not Found] → Toast + Redirect
[Navigation Error] → Auto redirect to Home
```

---

## Design Intent

- **Silent recovery**: La plupart des erreurs sont gérées sans intervention utilisateur
- **Clear feedback**: Quand intervention nécessaire, modal clair avec options
- **Data safety**: Backup auto avant toute action destructive
- **Graceful degradation**: Fallback SM-2 si WASM échoue
- **No panic**: Messages calmes, pas d'alarmes