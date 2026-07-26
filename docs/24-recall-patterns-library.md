# VersyFlow — Recall Patterns Library

> Bibliothèque de patterns de rappel réutilisables
> Ce document décrit chaque pattern avec ses règles, critères et cas d'usage

---

## 1. Patterns MVP

### P-001: Reading Active (Lecture Active)
**Objectif**: Familiarisation avec le texte avant mémorisation
**Input**: Texte complet du verset
**Output**: Compréhension du contenu
**Difficulté**: 1/5 (très facile)
**Coût cognitif**: Très faible
**Moment d'usage**: Avant toute session de mémorisation
**Raison d'être**: Établir une base de référence
**Critère d'adoption**: Toujours utilisé en premier
**Critère de rejet**: Jamais comme méthode unique

### P-002: Progressive Masking (Masquage Progressif)
**Objectif**: Mémorisation mot par mot de gauche à droite
**Input**: Verset + nombre de mots à cacher
**Output**: Sequence de taps révélant les mots cachés
**Difficulté**: 3/5 (moyen)
**Coût cognitif**: Faible-Moyen
**Moment d'usage**: Phase initiale de mémorisation
**Raison d'être**: Approche graduelle qui réduit la charge cognitive
**Critère d'adoption**: Standard pour premier contact avec un verset
**Critère de rejet**: Ne jamais utiliser seul — manque d'engagement actif

### P-003: Free Recall (Rappel Libre)
**Objectif**: Rappeler le verset sans aucun indice
**Input**: Référence seule ("Jean 3:16")
**Output**: Texte complet tapé ou dicté
**Difficulté**: 5/5 (très difficile)
**Coût cognitif**: Élevé
**Moment d'usage**: Vérification de rétention, versets maîtrisés
**Raison d'être**: Test ultime de mémorisation profonde
**Critère d'adoption**: Uniquement quand stability > 7 jours
**Critère de rejet**: Pas pour apprentissage initial

### P-004: Full Typing (Saisie Complète)
**Objectif**: Taper le verset complet en mémoire
**Input**: Zéro indice textuel
**Output**: Texte identique au verset attendu
**Difficulté**: 5/5 (très difficile)
**Coût cognitif**: Très élevé
**Moment d'usage**: Vérification finale de maîtrise
**Raison d'être**: Engager la mémoire musculaire + mémoire sémantique
**Critère d'adoption**: Versets avec stability > 30 jours
**Critère de rejet**: Trop frustrant pour débutants

### P-005: Reference Recall (Rappel par Référence)
**Objectif**: Rappeler un verset après avoir vu sa référence
**Input**: "Psaume 23:1" (ou "Ps 23:1", "Psaume vingt-trois...")
**Output**: "L'Éternel est mon berger..."
**Difficulté**: 4/5 (difficile)
**Coût cognitif**: Moyen-Haut
**Moment d'usage**: Quand l'utilisateur apprend à identifier les références
**Raison d'être**: Développer la capacité à citer des versets exacts
**Critère d'adoption**: Après ~20 versets mémorisés
**Critère de rejet**: Trop ambitieux pour débutants

### P-006: First Letter Recall (Rappel par Première Lettre)
**Objectif**: Compléter en voyant seulement la première lettre de chaque mot
**Input**: "A c D c l c e l t."
**Output**: "Au commencement Dieu créa les cieux et la terre."
**Difficulté**: 3/5 (moyen)
**Coût cognitif**: Moyen
**Moment d'usage**: Renforcement intermédiaire
**Raison d'être**: Moins difficile que le rappel libre, plus engageant que le masquage
**Critère d'adoption**: Versets maîtrisés partiellement
**Critère de rejet**: Pas assez difficile pour la vérification finale

### P-007: Segment Recall (Rappel par Segments)
**Objectif**: Rappeler segment par segment au lieu du verset complet
**Input**: Verset découpé en 3-5 segments
**Output**: Chaque segment complété individuellement
**Difficulté**: 2/5 (facile)
**Coût cognitif**: Faible
**Moment d'usage**: Versets longs (>20 mots) ou difficiles
**Raison d'être**: Réduire la complexité par fragmentation intelligente
**Critère d'adoption**: Versets > 15 mots
**Critère de rejet**: Pas nécessaire pour courts versets (<10 mots)

### P-008: Cloze Recall (Rappel par Suppression)
**Objectif**: Compléter les trous dans le texte
**Input**: Verset avec certains mots retirés
**Output**: Mots manquants
**Difficulté**: 3/5 (moyen)
**Coût cognitif**: Moyen
**Moment d'usage**: Apprentissage de structure
**Raison d'être**: Focus sur la syntaxe et les mots-clés
**Critère d'adoption**: Après progressive masking réussi
**Critère de rejet**: Trop spécifique — ne teste pas la mémorisation globale

### P-009: Mixed Recall (Rappel Mixte)
**Objectif**: Alterner différents modes dans une même session
**Input**: Variable selon mode choisi
**Output**: Variable
**Difficulté**: 4/5 (variable)
**Coût cognitif**: Variable mais élevé
**Moment d'usage**: Sessions de renforcement avancées
**Raison d'être**: Éviter la lassitude et engager différents types de mémoire
**Critère d'adoption**: Utilisateur avec 5+ sessions complétées
**Critère de rejet**: Trop complexe pour débutants

### P-010: Consolidation Recall (Rappel de Consolidation)
**Objectif**: Rappel très espacé pour consolidation à long terme
**Input**: Référence + index de fragilité (mots oubliés précédemment)
**Output**: Texte complet ou segmenté selon fragilité
**Difficulté**: 4-5/5 (très difficile)
**Coût cognitif**: Très élevé
**Moment d'usage**: Après mastery atteint, intervalles très longs
**Raison d'être**: Empêcher l'oubli à long terme
**Critère d'adoption**: Stabilité > 60 jours
**Critère de rejet**: Pas adapté aux nouveaux apprenants

---

## 2. Combinaisons et Progression

### Progression Standard
```
1. Lecture Active → 2. Progressive Masking → 3. Cloze Recall → 
4. First Letter → 5. Segment Recall → 6. Mixed Recall → 
7. Free Recall → 8. Full Typing
```

### Progression Adaptative
Le système ajuste automatiquement:
- Si erreurs fréquentes → reculer d'un niveau
- Si rapidité élevée → avancer d'un niveau
- Si frustration détectée → changer de pattern

---

*Chaque pattern doit être implémenté comme un module indépendant utilisable dans n'importe quel ordre.*
