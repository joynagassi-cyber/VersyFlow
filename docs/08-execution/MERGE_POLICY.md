# VersyFlow — Code Review Rules & Merge Policy

> Document généré par le CEO Multi-Agent

---

## Code Review Rules

Chaque modification de code DOIT passer un code review AVANT merge. Le reviewer est soit un agent senior (Guardian), soit un humain.

### Checklist Architecture

- [ ] La couche du fichier respecte la règle de dépendance (09-architecture.md)
- [ ] Pas d'import d'une couche supérieure
- [ ] Les domaines n'importent pas depuis services/components/infrastructure
- [ ] Les composants n'importent pas depuis domains/services/infrastructure
- [ ] Les services utilisent les interfaces (ports), pas les implémentations
- [ ] Pattern adapter respecté pour infrastructure (IStorage, IFsrsEngine)

### Checklist Lisibilité

- [ ] Nommage conforme: PascalCase composants, camelCase hooks/services, UPPER_SNAKE_CASE constants
- [ ] Interface préfixée par `I`
- [ ] Fonctions < 40 lignes
- [ ] Complexité cyclomatique <= 5
- [ ] Pas de duplication (DRY)
- [ ] Commentaires expliquent le POURQUOI, pas le QUOI

### Checklist Performance

- [ ] Pas de calcul lourd dans le render React
- [ ] Composants fréquents optimisés avec React.memo
- [ ] Pas de memory leaks (event listeners, intervals cleanup)
- [ ] Liste de versets utilise virtualisation (FlashList/FlatList keyExtractor)
- [ ] WASM calls non-blockants (async, pas de await synchrone)

### Checklist Sécurité

- [ ] Pas de sécuisation d'entrée utilisateur non validée
- [ ] Pas de données sensibles en clair dans AsyncStorage
- [ ] Tous les appels WASM wrapped dans try/catch
- [ ] Actions destructives (reset progress) ont confirmation explicite

### Checklist UX

- [ ] Feedback visuel pour toute action async (spinner, skeleton)
- [ ] États loading/error/empty gérés
- [ ] Touch targets >= 44x44pt
- [ ] Animations respectent reduced motion preference
- [ ] Couleurs sémantiques accompagnées d'icones ou texte (pas uniquement couleur)

### Checklist i18n

- [ ] Zéro hardcoded string visible
- [ ] Toutes les clés de traduction existent dans les 5 fichiers locales
- [ ] Pluralisation {plural} utilisée quand nécessaire
- [ ] Textes RTL vérifiés (arabe)

---

## Merge Policy

### Quand un merge EST AUTORISÉ

1. **CI passe**: typecheck + lint + tests tous verts
2. **Code review approuvé**: Guardian OU agent senior a validé la checklist
3. **Pas de conflits Git**: le fichier n'a pas été modifié par un autre agent
4. **Documentation executée mise à jour**: si la tâche change la roadmap, Guardian met à jour docs/08-execution/

### Quand un merge est INTERDIT

1. CI échoue sur n'importe quel check
2. Code review non passé (aucun reviewer n'a approuvé)
3. Conflit Git détecté (2 agents ont modifié le même fichier)
4. Couverture de test inferieure au minimum exigé
5. Anti-pattern détecté (logique métier dans composant, etc.)

### Processus de Merge

```
[Agent termine une tâche]
    ↓
[Créer branch: feature/{nom-tâche}]
    ↓
[Push + ouvrir PR avec checklist cochée]
    ↓
[CI run automatique: typecheck, lint, tests]
    ↓
{CI vert?}
    ├─ NON → [Fix erreurs → retry max 3x → escalade]
    └─ OUI → [Reviewer (Guardian/humain) review code]
              ↓
        {Review passé?}
            ├─ NON → [Fix feedbacks → retry]
            └─ OUI → [Merge to main]
                      ↓
              [Agent poste: "Tâche mergee: {nom}"]
```

### Règles de Branching

- **main**: toujours stable, toujours buildable
- **feature/{nom}**: branches de travail des agents
- **hotfix/{description}**: pour bugs critiques, bypass code review mais nécessite approval Guardian après merge
- Aucune branch autre que main ne peut être pushée directement

---

*Ces règles s'appliquent à TOUT commit mergeant sur main.*
