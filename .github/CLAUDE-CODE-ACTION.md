# Claude Code Action

Ce workflow active l'assistant IA Claude Code dans ton projet GitHub.

## Fonctionnalités

- **Review de PRs automatiques** : Analyse les pull requests et fournit des commentaires
- **Réponse aux commentaires d'issues** : Peut répondre aux commentaires sur les issues
- **Exécution manuelle** : Peut être déclenché manuellement via `workflow_dispatch`
- **Suggestions d'améliorations** : Fournit des suggestions de code et d'architecture

## Configuration requise

### Secrets GitHub

Tu dois ajouter ces secrets dans les paramètres de ton repository :

1. **ANTHROPIC_API_KEY** : Ta clé API Anthropic pour Claude
   - Obtenu sur https://console.anthropic.com/
   - Va dans Settings → Secrets → Actions → New repository secret

### Permissions

Le workflow nécessite les permissions suivantes (déjà configurées dans le workflow) :
- `contents: read`
- `pull-requests: write`
- `issues: write`
- `id-token: write`

## Utilisation

### 1. Review automatique de PR

Le workflow se déclenche automatiquement à chaque nouvelle PR ou mise à jour.

### 2. Commenter sur une issue

Réponds à un commentaire d'issue avec une instruction, par exemple :
```
@claude-code Please review this bug report and suggest fixes
```

### 3. Exécution manuelle

Depuis l'onglet Actions de ton repository :
1. Clique sur "Claude Code AI Assistant"
2. Clique sur "Run workflow"
3. Remplis les paramètres (instructions, PR number, etc.)
4. Clique sur "Run workflow"

## Personnalisation

### Modifier le prompt par défaut

Dans `.github/workflows/claude-code.yml`, modifie la valeur par défaut de `INPUT_INSTRUCTIONS` :

```yaml
default: 'Your custom instructions here'
```

### Ajouter un fichier de contexte

Tu peux créer un fichier `.claude/CONTEXT.md` dans ton repository pour fournir du contexte supplémentaire à Claude Code.

### Ajouter des instructions spécifiques au projet

Crée un fichier `.claude/CLAUDE.md` pour définir des instructions personnalisées que Claude Code lira automatiquement.

## Dépannage

### Erreur: ANTHROPIC_API_KEY non défini
- Vérifie que le secret `ANTHROPIC_API_KEY` est bien configuré dans ton repository GitHub.

### Erreur de permission
- Vérifie que les permissions sont bien accordées dans le workflow.

### Le workflow ne se déclenche pas
- Vérifie que le workflow est activé dans l'onglet Actions de ton repository.
- Assure-toi que les triggers sont correctement configurés.

## Liens utiles

- [Documentation Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Anthropic API Documentation](https://docs.anthropic.com/en/api)
