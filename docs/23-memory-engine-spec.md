# VersyFlow — Memory Engine Specification

> Définit comment un verset est mémorisé activement
> Position: `src/domains/memorization/memory-engine.ts` (code) + ce doc (spec)

---

## 1. Vue d'Ensemble

Le Memory Engine orchestre **toutes les stratégies de mémorisation**. Chaque stratégie définit:
- Comment le verset est présenté à l'utilisateur
- Comment l'utilisateur répond
- Comment la réponse est évaluée
- Comment le résultat influence le FSRS state

---

## 2. Stratégies MVP (V0.1)

### M-001: Active Recall (Rappel Actif)
**Objectif**: L'utilisateur voit le verset complet puis le rappelle de mémoire
```
Étape 1: Afficher verset complet 10 secondes
Étape 2: Masquer tout
Étape 3: Utilisateur saisit de mémoire
Étape 4: Comparer avec engine
Étape 5: Noter avec FSRS
```
**Difficulté**: Moyenne
**Moment**: Premier contact avec un nouveau verset

### M-002: Progressive Masking (Masquage Progressif)
**Objectif**: Révéler mot par mot de gauche à droite
```
Étape 1: Affichage verset complet (preview)
Étape 2: Un mot révélé à la fois (tap-to-reveal)
Étape 3: Tous mots révélés → "J'ai mémorisé"
Étape 4: FSRS note GOOD par défaut
```
**Difficulté**: Faible-Moyenne
**Moment**: Phase initiale de mémorisation
**Utilisé dans le code actuel**: ✅ SessionEngine.revealNextWord()

### M-003: Incremental Reveal (Révélation Incrémentale)
**Objectif**: Montrer que quelques mots, révéler progressivement
```
Étape 1: Afficher 20% des mots (au hasard)
Étape 2: Révéler 20% supplémentaires sur tap
Étape 3: Continuer jusqu'à ce que 100% soient révélés
Étape 4: Vérification finale
```
**Difficulté**: Moyenne-Haute
**Moment**: Reinforcement après premier apprentissage

---

## 3. Stratégies V1

### M-004: Cloze Deletion (Suppression de Mots)
```
Afficher: "Au commencement ___ créa les cieux et la ___."
Utilisateur complète: "Dieu" → "terre"
```

### M-005: First Letter Mode (Première Lettre)
```
Afficher: "A_ c____ D__ c__ l c__ e l t__."
Utilisateur tape les lettres manquantes ou le mot complet
```

### M-006: Heat Words (Mots Chauds)
```
Basé sur l'historique, afficher en ROUGE les mots souvent oubliés
L'utilisateur doit les identifier correctement
```

### M-007: Memory Fingerprint (Empreinte Mémorielle)
```
Analyser quel type de mots l'utilisateur oublie systématiquement:
- Prépositions? Articles? Noms verbes?
- Adapter les exercices en conséquence
```

### M-008: Interleaving (Entrelacement)
```
Mélanger plusieurs versets mémorisés récemment
L'utilisateur doit identifier lequel correspond au texte affiché
```

### M-009: Overlearning (Surapprentissage)
```
Continuer les sessions même après maîtrise atteinte
Pour renforcer la rétention à long terme
```

---

## 4. Stratégies Futur (V2+)

### M-010: Typing Mode
Saisie complète du verset sans indices

### M-011: Chunk Learning
Apprendre par segments (3-5 mots)

### M-012: Multi-modal Recall
Associer audio + texte pour mémorisation multisensorielle

### M-013: Memory Coach
IA qui adapte automatiquement la stratégie selon:
- Heure de la journée (chronotype)
- fatigue détectée
- vitesse de réponse moyenne
- types de mots oubliés fréquemment

### M-014: Reference Recall
Voir seulement la référence ("Jean 3:16") → rappeler le texte complet

### M-015: Competitive Mode
Défis entre amis: qui mémorise le plus vite

---

## 5. Règles de Sélection Automatique

Le système choisit automatiquement la stratégie:

| Situation | Stratégie | Raison |
|-----------|-----------|--------|
| Nouveau verset | Progressive Masking | Apprentissage doux |
| Après遗忘 | Active Recall | Renforcer le rappel actif |
| Stabilité > 7 jours | Incremental Reveal | Challenge augmenté |
| Stabilité > 30 jours | Overlearning | Consolidation |
| Mots fréquemment oubliés | Heat Words | Cibler les faiblesses |
| 3+ mauvaises notes | Cloze Deletion | Focus sur structure |

---

## 6. Critères de Transition entre Modes

```typescript
interface StrategySelector {
  /** When to switch FROM a strategy */
  exitCriteria: {
    masteryThreshold: number;      // Quand mastery > X → sortir
    timeInSession: number;         // Max durée session
    errorRate: number;             // Si erreurs > Y → changer mode
  };
  
  /** When to switch TO a strategy */
  entryCriteria: {
    initialContact: boolean;       // Premier apprentissage
    needsReinforcement: boolean;   // Besoin de renforcement
    consolidation: boolean;        // Phase de consolidation
  };
}
```

---

*Ce document est la source de vérité pour le développement futur des stratégies de mémorisation.*
