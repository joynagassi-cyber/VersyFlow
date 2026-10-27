# VersyFlow — Retrieval Analytics Specification

> Métriques de rétention pour comprendre POURQUOI un verset est retenu ou oublié
> Position: `src/services/retrieval-analytics.ts` (code) + ce doc (spec)

---

## 1. Objectif du Système

Le système de retrieval analytics répond à ces questions:
- Quel verset je retiendrai dans 6 mois?
- Pourquoi j'oublie systématiquement certains mots?
- Quelle stratégie fonctionne le mieux pour moi?
- Où en suis-je dans mon apprentissage global?

---

## 2. Métriques Essentielles

### Mémorisation Individuelle

| Métrique | Description | Calcul | Priorité |
|----------|-------------|--------|----------|
| Taux de Rappel | % de fois où le verset a été rappelé correctement | `correct / total_reviews * 100` | MUST |
| Taux de Rétention | % d'information conservée après N jours | `stability / predicted_interval * 100` | MUST |
| Fréquence d'Erreur par Mot | Nombre d'erreurs sur chaque mot | `count(errors where word = X)` | SHOULD |
| Stabilité Moyenne | Valeur moyenne de stabilité FSRS | `mean(all fsrsState.stability values)` | MUST |
| Difficulté Moyenne | Valeur moyenne de difficulté FSRS | `mean(all fsrsState.difficulty values)` | SHOULD |
| Lapses | Perte brutale de mémorisation (soudaine) | `sudden_drop_in_stability_count` | SHOULD |
| Répétitions Nécessaires | Nombre de reviews jusqu'à maîtrise | `count(reviews until mastery)` | MUST |

### Par Verset

| Métrique | Description | Utilité |
|----------|-------------|---------|
| Indice de Maîtrise | Score composite 0-100 | Voir état actuel du verset |
| Courbe d'Oubli | Graphique P(recall) over time | Identifier moments optimaux de révision |
| Fragilité des Mots | Quels mots sont toujours oubliés | Cibler les renforcements |
| Vitesse de Consolidation | Temps moyen entre une erreur et sa correction | Évaluer efficacité des méthodes |
| Effet de Saut | Progrès soudains après un blocage | Comprendre les breakthroughs |

### Par Livre

| Métrique | Description | Utilité |
|----------|-------------|---------|
| Maîtrise du Livre | % de versets maîtrisés dans un livre | Visualiser progression globale |
| Versets Difficiles du Livre | Top 5 versets les plus oubliés | Cibler les renforcements |
| Effort Investi | Total sessions × durée moyenne | Engagement utilisateur |
| Rendement | Versets maîtrisés / heures investies | Efficacité |

### Par Type d'Exercice

| Métrique | Description | Utilité |
|----------|-------------|---------|
| Efficacité par Pattern | % succès par type d'exercice | Ajuster la progression |
| Coût Cognitif | Temps moyen pour compléter un exercice | Valider l'engagement |
| Préférence Utilisateur | Patterns préférés (temps d'engagement long) | Personnalisation future |

### Temporel

| Métrique | Description | Utilité |
|----------|-------------|---------|
| Progression Hebdomadaire | Évolution des stats sur 7 jours | Motiver, détecter stagnation |
| Mémoire Fragile | Versets avec stability < 3 jours | Alert précoce avant oubli |
| Mémoire Consolidée | Versets avec stability > 30 jours | Récompense motivationnelle |

---

## 3. Formules Clés

### Index de Maîtrise d'un Verset (0-100)
```typescript
function calculateMasteryIndex(record: MemorizationRecord): number {
  const stabilityScore = Math.min(100, record.fsrsState.stability / 3); // Normalize to 0-100 based on 30 day mastery
  const repetitionScore = Math.min(100, record.fsrsState.repetitions * 10); // 10 reps = 100%
  const recallScore = record.fsrsState.recallProbability * 100;
  
  return Math.round(
    stabilityScore * 0.4 + 
    repetitionScore * 0.3 + 
    recallScore * 0.3
  );
}
```

### Taux de Rétention sur N Jours
```typescript
function retentionRateForDays(record: MemorizationRecord, days: number): number {
  const daysSinceLastReview = (Date.now() - record.lastReviewedAt) / 86400000;
  if (daysSinceLastReview > days) return 0;
  return record.fsrsState.recallProbability;
}
```

### Détection de Lapse (Perte Brutale)
```typescript
function detectLapse(historicalReviews: ReviewLogEntry[]): boolean {
  if (historicalReviews.length < 5) return false;
  
  const recentStabilities = historicalReviews.slice(-5).map(r => r.stabilityAfter);
  const olderStabilities = historicalReviews.slice(-10, -5).map(r => r.stabilityAfter);
  
  const recentAvg = mean(recentStabilities);
  const olderAvg = mean(olderStabilities);
  
  return recentAvg < olderAvg * 0.5; // Stability dropped more than 50%
}
```

### Score d'Efficacité par Pattern
```typescript
function patternEfficiency(pattern: string, reviews: ReviewLogEntry[]): number {
  const successfulReviews = reviews.filter(r => r.rating === 'good' || r.rating === 'easy');
  return successfulReviews.length / reviews.length;
}
```

---

## 4. Sortie Structurée

```typescript
interface RetrievalAnalyticsReport {
  // Global User Stats
  totalVerses: number;
  masteredVerses: number;
  inProgressVerses: number;
  dueForReview: number;
  
  // Weekly Trend
  weeklyTrend: {
    versesMemorizedThisWeek: number;
    versesMemorizedLastWeek: number;
    percentageChange: number;
    streakCount: number;
    averageSessionDurationMin: number;
  };
  
  // Per Verse Detail
  verseReports: Array<{
    id: string;
    reference: string;
    masteryIndex: number;
    estimatedDaysUntilForget: number;
    mostForgottenWords: string[];
    strongestPortions: Array<{start: number; end: number}>;
    weakestPortions: Array<{start: number; end: number}>;
    recommendedPattern: ExerciseStrategy;
  }>;
  
  // Strategic Insights
  insights: {
    mostEffectivePatterns: string[];       // Top 3 patterns by success rate
    mostDifficultBooks: string[];          // Books with lowest mastery average
    mostVulnerableVerses: string[];        // Verses at risk of being forgotten
    optimizationSuggestions: string[];     // Actionable advice
  };
}
```

---

## 5. Intégration avec l'UI

### Dashboard Progression
- Afficher les stats globales (versets mémorisés, streak, taux de rétention)
- Graphique hebdomadaire (bar chart des sessions par jour)
- Liste triable: à renforcer / maîtrisés / en cours

### Feedback Immédiat Post-Session
- Après chaque session: message comme "Vous oubliez souvent 'Dieu' — pensez à répéter ce mot"
- Visualisation des mots fragiles dans le verset suivant

### Notifications Proactives (V1+)
- Push reminder: "Le Psaume 23 est près d'être oublié — révisez-le maintenant"
- Message de motivation: "Votre moyenne de rétention a augmenté de 5% cette semaine!"

---

*Ce système d'analytics doit être extensible: nouvelles métriques peuvent être ajoutées sans casser l'existant.*
