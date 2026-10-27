# VersyFlow — Constitution du Projet

> Document fondamental — Loi suprême du projet
> Toutes les règles, spécifications et codes doivent respecter cette Constitution
> Toute modification nécessite un vote formel (3/6 agents + humain si disponible)

---

## Article I — Principes Fondateurs

### IF-1 : Le Produit
**VersyFlow est un outil de mémorisation biblique basé sur la science FSRS.**
Le produit existe pour aider les croyants à mémoriser les versets bibliques.

```
✅ CORRECT : "Ajouter une nouvelle stratégie de mémorisation"
❌ INTERDIT : "Ajouter un chat communautaire"
```

### IF-2 : La Méthode
**VersyFlow est développé avec React Native + Expo + TypeScript + Rust (FSRS).**

```
✅ CORRECT : Utiliser Zustand pour le state management
❌ INTERDIT : Migrer vers Redux ou MobX
```

### IF-3 : L'Approche
**Offline-first, modulaire, agnostique aux langues.**

---

## Article II — Règles Immuables

### IR-1 : Aucune logique métier dans les composants UI
Les composants sont des fonctions pures de rendu uniquement.

### IR-2 : Agnosticisme linguistique total
UI Language ≠ Bible Translation — jamais couplés.

### IR-3 : FSRS isolé dans une couche dédiée
Communication exclusive via IFsrsEngine interface.

### IR-4 : Offline-first absolu
Toutes les opérations fonctionnent sans connexion.

### IR-5 : Aucune dépendance circulaire
Chaque module importe uniquement des modules en dessous de lui.

---

## Article III — Règles d'Architecture

### AR-1 : Structure des couches
```
UI Layer (app/, src/components/)
    ↓ imports from
Hooks (src/hooks/)
    ↓ imports from
Services (src/services/)
    ↓ imports from
Domains (src/domains/)
    ↓ calls ports that are implemented by
Infrastructure (src/infrastructure/)
```

### AR-2 : Dépendances interdites

| De | Vers | Interdit |
|----|------|----------|
| components/ | services/ | ❌ |
| components/ | domains/ | ❌ |
| components/ | infrastructure/ | ❌ |
| domains/ | services/ | ❌ |
| domains/ | components/ | ❌ |
| services/ | components/ | ❌ |

### AR-3 : Adapter Pattern Obligatoire
Toute infrastructure doit être accessible via une interface abstraite.

---

## Article IV — Règles de Modularité

### MR-1 : Extension sans modification
Principe Open/Closed strict.

### MR-2 : Un dossier = un propriétaire
Matricule MODULE_OWNERSHIP.md immuable.

### MR-3 : Barrel exports obligatoires
Chaque dossier/domaine exporte ses types publics.

---

## Article V — Règles de Documentation

### DR-1 : Documentation avant code
Chaque feature doit avoir son doc créé AVANT l'implémentation.

### DR-2 : Spécifications immuables
docs/01-* à docs/27-* ne sont PAS modifiées après validation.

### DR-3 : Décisions enregistrées
DECISION_LOG.md tenu à jour par Guardian.

---

## Article VI — Règles de Qualité

### QR-1 : Couverture minimale
- Domaines ≥ 90%
- Services ≥ 70%
- E2E ≤ 10% total

### QR-2 : Performance
- Écrans < 200ms
- App footprint < 50MB

### QR-3 : Accessibilité
- WCAG 2.1 AA minimum
- Contraste ≥ 4.5:1
- Touch targets ≥ 44x44pt

---

## Article VII — Règles de Validation

### VR-1 : Definition of Ready
Aucune tâche ne commence sans DoR complet.

### VR-2 : Definition of Done
Aucune tâche n'est terminée sans DoD complet.

### VR-3 : CI Gates
Typecheck → Lint → Test → Build → Deploy

---

*Cette Constitution est la loi suprême du projet VersyFlow. Elle ne peut être modifiée que par vote formel de tous les agents IA impliqués.*
